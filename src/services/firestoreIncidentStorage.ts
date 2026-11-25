import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { db, auth } from './firebaseAuth';

export async function testFirestoreWrite(): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Bạn chưa đăng nhập Firebase.');
  }

  const testRef = doc(db, 'connectionTests', user.uid);

  try {
    await setDoc(testRef, {
      test: true,
      email: user.email,
      createdAt: serverTimestamp(),
    });

    console.log('Đã ghi thử thành công lên Firestore.');

    await deleteDoc(testRef);

    console.log('Đã xóa tài liệu thử nghiệm thành công.');
  } catch (error) {
    console.error('Kiểm tra Firestore thất bại:', error);
    throw error;
  }
}