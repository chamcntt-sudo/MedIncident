import 'dotenv/config';
import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_INCIDENTS,
  HOSPITAL_DEPARTMENTS,
  DEFAULT_HOSPITAL_INFO,
  DEFAULT_QUALITY_ASSESSMENT,
} from './src/data/mockHospitalData';
import {
  IncidentReport,
  NotificationItem,
  HospitalDepartment,
  HospitalInfo,
  QualityAssessmentState,
} from './src/types/incident';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, 'hospital-central-db.json');

interface CentralDatabaseState {
  hospitalInfo: HospitalInfo;
  departments: HospitalDepartment[];
  incidents: IncidentReport[];
  notifications: NotificationItem[];
  formConfig: {
    formId: string;
    formUrl: string;
    lastSyncedAt?: string;
    syncCount: number;
  };
  qualityAssessment?: QualityAssessmentState;
  updatedAt: string;
}

const LEGACY_DEMO_INCIDENT_IDS = new Set([
  'SCI-2026-0038',
  'SCI-2026-0039',
  'SCI-2026-0040',
  'SCI-2026-0041',
  'SCI-2026-0042',
  'SCI-2026-0043',
]);

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'note-1791769810150-873',
    incidentId: 'SCI-2026-0044',
    title: 'Báo cáo sự cố mới (NC2)',
    message: 'Khoa Nội - Nhi: trượt chân cầu thang',
    severity: 'NC2',
    createdAt: '2026-10-12T01:50:10.151Z',
    read: false,
    type: 'NEW_REPORT',
  },
];

function getDefaultState(): CentralDatabaseState {
  return {
    hospitalInfo: DEFAULT_HOSPITAL_INFO,
    departments: HOSPITAL_DEPARTMENTS,
    incidents: INITIAL_INCIDENTS,
    notifications: INITIAL_NOTIFICATIONS,
    qualityAssessment: DEFAULT_QUALITY_ASSESSMENT,
    formConfig: {
      formId: '1FAIpQLSeDUZJEuDw6oQeqxkHe5Yz34_P1pv4oef21u59rtKmkSwppXA',
      formUrl:
        'https://docs.google.com/forms/d/e/1FAIpQLSeDUZJEuDw6oQeqxkHe5Yz34_P1pv4oef21u59rtKmkSwppXA/viewform?usp=header',
      syncCount: 2,
      lastSyncedAt: '2026-09-30T10:15:00.000Z',
    },
    updatedAt: new Date().toISOString(),
  };
}

function loadDatabase(): CentralDatabaseState {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      const rawIncidents: IncidentReport[] = Array.isArray(parsed.incidents)
        ? parsed.incidents
        : INITIAL_INCIDENTS;
      const cleanedIncidents = rawIncidents.filter(
        (inc) => inc && !LEGACY_DEMO_INCIDENT_IDS.has(inc.id)
      );
      const rawNotes: NotificationItem[] = Array.isArray(parsed.notifications)
        ? parsed.notifications
        : INITIAL_NOTIFICATIONS;
      const cleanedNotes = rawNotes.filter(
        (n) => n && !LEGACY_DEMO_INCIDENT_IDS.has(n.incidentId)
      );
      return {
        ...getDefaultState(),
        ...parsed,
        incidents: cleanedIncidents,
        notifications: cleanedNotes,
        qualityAssessment: parsed.qualityAssessment || DEFAULT_QUALITY_ASSESSMENT,
        hospitalInfo: { ...DEFAULT_HOSPITAL_INFO, ...(parsed.hospitalInfo || {}) },
      };
    }
  } catch (err) {
    console.error('Lỗi đọc file cơ sở dữ liệu trung tâm:', err);
  }
  const initial = getDefaultState();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(state: CentralDatabaseState): void {
  try {
    state.updatedAt = new Date().toISOString();
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Lỗi lưu file cơ sở dữ liệu trung tâm:', err);
  }
}

let dbState: CentralDatabaseState = loadDatabase();

// Connected SSE clients for instant real-time push
const sseClients = new Set<express.Response>();

function broadcastState(eventType = 'STATE_UPDATED', extra?: Record<string, unknown>) {
  const payload = JSON.stringify({
    type: eventType,
    state: dbState,
    ...extra,
  });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

function sortIncidentsNewestFirst(incidents: IncidentReport[]): IncidentReport[] {
  return [...incidents].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.incidentTime || 0).getTime();
    const timeB = new Date(b.createdAt || b.incidentTime || 0).getTime();
    return timeB - timeA;
  });
}

// Khởi tạo Firebase Admin SDK
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const projectId = process.env.FIREBASE_PROJECT_ID;
const databaseId = process.env.FIRESTORE_DATABASE_ID;

if (!projectId || !databaseId) {
  throw new Error('Thiếu FIREBASE_PROJECT_ID hoặc FIRESTORE_DATABASE_ID');
}

const firebaseAdminApp =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: serviceAccountPath
          ? cert(JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8')))
          : applicationDefault(),
        projectId,
      });

const adminFirestore = getFirestore(firebaseAdminApp, databaseId);
// Xác thực Firebase ID Token và kiểm tra quyền người dùng
async function verifyUser(req: express.Request) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED');
  }

  const idToken = authHeader.substring(7);
 
  const decodedToken = await getAuth(firebaseAdminApp).verifyIdToken(idToken);

  const userDoc = await adminFirestore
    .collection('users')
    .doc(decodedToken.uid)
    .get();

  if (!userDoc.exists) {
    throw new Error('USER_NOT_FOUND');
  }

  const userData = userDoc.data();

  if (userData?.active !== true) {
    throw new Error('ACCOUNT_DISABLED');
  }

  return {
    uid: decodedToken.uid,
    role: userData.role,
    department: userData.department,
  };
}

async function requireAdmin(req: express.Request) {
  const user = await verifyUser(req);

  if (user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN');
  }

  return user;
}
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Enable CORS for mobile devices scanning QR codes & cross-container synchronization
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(express.json({ limit: '10mb' }));

  const DEV_REMOTE_URL = 'https://ais-dev-k6v6qpwl2nywlip64n43qs-505568339029.asia-southeast1.run.app';
  const PRE_REMOTE_URL = 'https://ais-pre-k6v6qpwl2nywlip64n43qs-505568339029.asia-southeast1.run.app';

  // Chuyển tiếp ngay lập tức sự cố tới máy chủ đồng hành (ais-dev <-> ais-pre)
  const relayIncidentToCompanion = (incident: IncidentReport, notification?: NotificationItem) => {
    const targets = [DEV_REMOTE_URL, PRE_REMOTE_URL];
    for (const target of targets) {
      fetch(`${target}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident, notification, isRelayed: true }),
      }).catch(() => {
        // bỏ qua lỗi nếu máy chủ đích tạm thời offline
      });
    }
  };

  // Đồng bộ định kỳ 5 giây 1 lần giữa các container (ais-dev và ais-pre)
  let isCompanionSyncing = false;
  const syncWithRemoteContainers = async () => {
    if (isCompanionSyncing) return;
    isCompanionSyncing = true;
    try {
      const targets = [PRE_REMOTE_URL, DEV_REMOTE_URL];
      for (const target of targets) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`${target}/api/state?_t=${Date.now()}`, {
          signal: controller.signal,
        }).catch(() => null);
        clearTimeout(timeoutId);

        if (res && res.ok) {
          const remoteState = (await res.json()) as Partial<CentralDatabaseState>;
          if (remoteState.incidents && Array.isArray(remoteState.incidents)) {
            let changed = false;
            const incMap = new Map<string, IncidentReport>();
            for (const inc of dbState.incidents) {
              if (!LEGACY_DEMO_INCIDENT_IDS.has(inc.id)) {
                incMap.set(inc.id, inc);
              }
            }
            for (const inc of remoteState.incidents) {
              if (!inc || !inc.id || LEGACY_DEMO_INCIDENT_IDS.has(inc.id)) continue;
              const ex = incMap.get(inc.id);
              if (!ex) {
                incMap.set(inc.id, inc);
                changed = true;
              } else {
                const exTime = new Date(ex.updatedAt || ex.createdAt || 0).getTime();
                const incTime = new Date(inc.updatedAt || inc.createdAt || 0).getTime();
                if (incTime > exTime) {
                  incMap.set(inc.id, inc);
                  changed = true;
                }
              }
            }
            if (changed) {
              dbState.incidents = sortIncidentsNewestFirst(Array.from(incMap.values()));
              saveDatabase(dbState);
              broadcastState('STATE_UPDATED');
            }
          }
        }
      }
    } catch {
      // ignore
    } finally {
      isCompanionSyncing = false;
    }
  };

  setInterval(syncWithRemoteContainers, 5000);

  // 1. SSE Real-Time Stream
  app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial snapshot immediately
    res.write(
      `data: ${JSON.stringify({
        type: 'INITIAL_STATE',
        state: dbState,
      })}\n\n`
    );

    sseClients.add(res);

    const keepAlive = setInterval(() => {
      try {
        res.write(': keep-alive\n\n');
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  // 2. Get full central state
  app.get('/api/state', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json(dbState);
  });

  // 3. Smart merge state from client localStorage so no local report is ever lost
  app.post('/api/state/merge', (req, res) => {
    const incoming = req.body as Partial<CentralDatabaseState>;
    let changed = false;

    if (incoming.incidents && Array.isArray(incoming.incidents)) {
      const map = new Map<string, IncidentReport>();
      for (const inc of dbState.incidents) {
        if (!LEGACY_DEMO_INCIDENT_IDS.has(inc.id)) {
          map.set(inc.id, inc);
        }
      }
      for (const inc of incoming.incidents) {
        if (!inc || !inc.id || LEGACY_DEMO_INCIDENT_IDS.has(inc.id)) continue;
        const existing = map.get(inc.id);
        if (!existing) {
          map.set(inc.id, inc);
          changed = true;
        } else {
          const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
          const incomingTime = new Date(inc.updatedAt || inc.createdAt || 0).getTime();
          if (incomingTime > existingTime) {
            map.set(inc.id, inc);
            changed = true;
          }
        }
      }
      if (changed) {
        dbState.incidents = sortIncidentsNewestFirst(Array.from(map.values()));
      }
    }

    if (incoming.notifications && Array.isArray(incoming.notifications)) {
      const noteMap = new Map<string, NotificationItem>();
      for (const n of dbState.notifications) {
        if (!LEGACY_DEMO_INCIDENT_IDS.has(n.incidentId)) {
          noteMap.set(n.id, n);
        }
      }
      for (const n of incoming.notifications) {
        if (!n || !n.id || LEGACY_DEMO_INCIDENT_IDS.has(n.incidentId)) continue;
        const ex = noteMap.get(n.id);
        if (!ex) {
          noteMap.set(n.id, n);
          changed = true;
        } else if (n.read && !ex.read) {
          noteMap.set(n.id, { ...ex, read: true });
          changed = true;
        }
      }
      if (changed) {
        dbState.notifications = Array.from(noteMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    }

    if (incoming.hospitalInfo && incoming.hospitalInfo.name) {
      // If incoming hospitalInfo has customized fields compared to default, apply it
      const incInfo = incoming.hospitalInfo;
      if (
        incInfo.directorName !== DEFAULT_HOSPITAL_INFO.directorName ||
        incInfo.name !== DEFAULT_HOSPITAL_INFO.name ||
        incInfo.qualityHeadName !== DEFAULT_HOSPITAL_INFO.qualityHeadName ||
        incInfo.hotline !== DEFAULT_HOSPITAL_INFO.hotline
      ) {
        if (JSON.stringify(dbState.hospitalInfo) !== JSON.stringify(incInfo)) {
          dbState.hospitalInfo = { ...dbState.hospitalInfo, ...incInfo };
          changed = true;
        }
      }
    }

    if (changed) {
      saveDatabase(dbState);
      broadcastState('STATE_MERGED');
    }

    res.json(dbState);
  });

  // 4. Direct state update (Hospital Info, Departments, Bulk Incidents, Form Config)
  app.post('/api/state', (req, res) => {
    const body = req.body as Partial<CentralDatabaseState>;
    if (body.hospitalInfo) {
      dbState.hospitalInfo = { ...dbState.hospitalInfo, ...body.hospitalInfo };
    }
    if (body.departments && Array.isArray(body.departments)) {
      dbState.departments = body.departments;
    }
    if (body.incidents && Array.isArray(body.incidents)) {
      dbState.incidents = sortIncidentsNewestFirst(body.incidents);
    }
    if (body.notifications && Array.isArray(body.notifications)) {
      dbState.notifications = body.notifications;
    }
    if (body.formConfig) {
      dbState.formConfig = { ...dbState.formConfig, ...body.formConfig };
    }
    if (body.qualityAssessment) {
      dbState.qualityAssessment = body.qualityAssessment;
    }
    saveDatabase(dbState);
    broadcastState('STATE_UPDATED');
    res.json(dbState);
  });

  // 5. Instant Upsert Single Incident (for fastest real-time reporting from any device)
  app.post('/api/incidents', (req, res) => {
    const { incident, notification } = req.body as {
      incident: IncidentReport;
      notification?: NotificationItem;
    };
    if (!incident || !incident.id) {
      res.status(400).json({ error: 'Thiếu dữ liệu sự cố' });
      return;
    }

    const idx = dbState.incidents.findIndex((i) => i.id === incident.id);
    const isNew = idx === -1;
    if (isNew) {
      dbState.incidents = sortIncidentsNewestFirst([incident, ...dbState.incidents]);
    } else {
      const next = [...dbState.incidents];
      next[idx] = incident;
      dbState.incidents = sortIncidentsNewestFirst(next);
    }

    if (notification && notification.id) {
      const existsNote = dbState.notifications.some((n) => n.id === notification.id);
      if (!existsNote) {
        dbState.notifications = [notification, ...dbState.notifications];
      }
    }

    saveDatabase(dbState);
    broadcastState(isNew ? 'INCIDENT_CREATED' : 'INCIDENT_UPDATED', {
      incidentId: incident.id,
      incidentTitle: incident.title,
      department: incident.department,
    });

    if (!req.body.isRelayed) {
      relayIncidentToCompanion(incident, notification);
    }

    res.json({ success: true, incident, state: dbState });
  });

  // 6. Delete Single Incident
  app.delete('/api/incidents/:id', (req, res) => {
    const { id } = req.params;
    dbState.incidents = dbState.incidents.filter((i) => i.id !== id);
    dbState.notifications = dbState.notifications.filter((n) => n.incidentId !== id);
    saveDatabase(dbState);
    broadcastState('INCIDENT_DELETED', { incidentId: id });
    res.json({ success: true, state: dbState });
  });

  // 7. Reset Database to Initial Hospital Data
  app.post('/api/reset', (_req, res) => {
    dbState = getDefaultState();
    saveDatabase(dbState);
    broadcastState('STATE_RESET');
    res.json(dbState);
  });

  // Vite middleware for development, static dist for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server MedIncident running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
