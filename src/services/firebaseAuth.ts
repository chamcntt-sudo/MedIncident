/**
 * Firebase Authentication & Google Workspace OAuth Client
 * Quản lý xác thực Google và cấp Access Token an toàn trong bộ nhớ (In-memory)
 */
import { UserRole } from '../types/incident';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Provider with required Google Forms OAuth scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/forms.body.readonly');
provider.addScope('https://www.googleapis.com/auth/forms.responses.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

/**
 * Lắng nghe thay đổi trạng thái xác thực
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token has expired or state reloaded; user can re-authenticate
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Đăng nhập tài khoản Google và cấp OAuth access token
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Không lấy được Access Token từ Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Lấy Access token đang được cache trong RAM
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};
/**
 * Lấy Firebase ID Token để xác thực với backend
 */
export const getFirebaseIdToken = async (): Promise<string | null> => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return null;
  }

  return await currentUser.getIdToken();
};
/**
 * Đăng xuất
 */
export const logoutUser = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
/**
 * Lấy hồ sơ và quyền của người dùng từ Firestore
 */
export interface UserProfile {
  role: UserRole;
  active: boolean;
  department: string;
  displayName: string;
  email: string;
}

export const getUserProfile = async (
  uid: string
): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDocFromServer(userRef);

    if (!userSnap.exists()) {
      console.error('Không tìm thấy hồ sơ người dùng trên Firestore');
      return null;
    }

    const data = userSnap.data();

    const validRoles: UserRole[] = [
      'ADMIN',
      'MANAGER',
      'STAFF',
      'PATIENT',
    ];

    if (
      data.active !== true ||
      !validRoles.includes(data.role as UserRole)
    ) {
      console.error('Tài khoản chưa được kích hoạt hoặc vai trò không hợp lệ');
      return null;
    }

    return {
      role: data.role as UserRole,
      active: data.active,
      department: data.department || '',
      displayName: data.displayName || '',
      email: data.email || '',
    };
  } catch (error) {
    console.error('Lỗi lấy hồ sơ người dùng:', error);
    return null;
  }
};