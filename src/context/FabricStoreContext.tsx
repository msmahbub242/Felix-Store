import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  PurchaseOrder,
  FabricRoll,
  FabricReceiveRecord,
  FabricIssueRecord,
  WarehouseRack,
  QualityStatus,
  StockStatus,
  StoreUser,
  UserPermission,
  ROLE_DEFAULT_PERMISSIONS,
} from '../types/fabric';
import {
  INITIAL_POS,
  INITIAL_ROLLS,
  INITIAL_RECEIVES,
  INITIAL_ISSUES,
  INITIAL_RACKS,
  INITIAL_USERS,
} from '../data/seedData';
import { db } from '../services/firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  addDoc,
  getDoc,
} from 'firebase/firestore';

interface FabricStoreContextType {
  pos: PurchaseOrder[];
  rolls: FabricRoll[];
  receives: FabricReceiveRecord[];
  issues: FabricIssueRecord[];
  racks: WarehouseRack[];

  // RBAC & User Management
  users: StoreUser[];
  currentUser: StoreUser;
  isAuthenticated: boolean;
  login: (identifier: string, password?: string, remember?: boolean) => { success: boolean; error?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  addUser: (userData: Omit<StoreUser, 'id' | 'createdAt'>) => StoreUser;
  updateUser: (userId: string, updates: Partial<StoreUser>) => void;
  deleteUser: (userId: string) => boolean;
  hasPermission: (permission: keyof UserPermission) => boolean;

  // PO methods
  addPO: (po: Omit<PurchaseOrder, 'id' | 'createdAt'>) => PurchaseOrder;
  updatePO: (id: string, po: Partial<PurchaseOrder>) => void;
  deletePO: (id: string) => boolean;
  getPOById: (id: string) => PurchaseOrder | undefined;
  getPOByNumber: (poNumber: string) => PurchaseOrder | undefined;

  // Roll & Serial methods
  getNextRollNumberForPO: (poNumber: string, prefix?: string) => { rollNo: string; nextIndex: number };
  getAvailableRollsForPO: (poNumber: string) => FabricRoll[];
  getRollsForPO: (poNumber: string) => FabricRoll[];

  // Receive methods
  createReceive: (
    receiveData: {
      receivingDate: string;
      challanNo: string;
      poNumber: string;
      supplier: string;
      receivedBy: string;
      remarks?: string;
    },
    rollItems: {
      color: string;
      fabricType: string;
      gsm: number;
      lotNo: string;
      weight: number;
      rackNo: string;
      width: string;
      qualityStatus: QualityStatus;
      shadeGrade?: string;
      remarks?: string;
    }[]
  ) => FabricReceiveRecord;

  // Issue methods
  createIssue: (
    issueData: {
      issueDate: string;
      issueSlipNo: string;
      poNumber: string;
      issuedTo: string;
      issuedBy: string;
      purpose: string;
      remarks?: string;
    },
    itemsToIssue: { rollId: string; weightToIssue: number }[]
  ) => FabricIssueRecord;

  // Rack & Utility methods
  addRack: (rack: WarehouseRack) => void;
  updateRack: (id: string, rack: Partial<WarehouseRack>) => void;
  transferRollRack: (rollId: string, targetRackNo: string) => void;
  updateRollStatus: (rollId: string, status: QualityStatus) => void;
  resetToInitialData: () => Promise<void>;
  createBackup: () => Promise<void>;
  restoreFromBackup: (backupId: string) => Promise<void>;
  listBackups: () => Promise<any[]>;

  // Computed metrics
  stats: {
    totalInStockKg: number;
    totalActiveRolls: number;
    totalExhaustedRolls: number;
    totalReceivedKg: number;
    totalIssuedKg: number;
    totalPosCount: number;
    activePosCount: number;
    slowMovingKg: number;
    slowMovingRollsCount: number;
  };
}

const STORAGE_KEYS = {
  POS: 'texstore_pos_v2',
  ROLLS: 'texstore_rolls_v2',
  RECEIVES: 'texstore_receives_v2',
  ISSUES: 'texstore_issues_v2',
  RACKS: 'texstore_racks_v2',
  USERS: 'texstore_users_v2',
  AUTH_SESSION: 'felix_auth_session_v3',
};

const FabricStoreContext = createContext<FabricStoreContextType | undefined>(undefined);

export const FabricStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Users & RBAC state
  const [users, setUsers] = useState<StoreUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      const savedSession =
        localStorage.getItem(STORAGE_KEYS.AUTH_SESSION) ||
        sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (savedSession && users.some(u => u.id === savedSession)) return savedSession;
      return null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedSession =
        localStorage.getItem(STORAGE_KEYS.AUTH_SESSION) ||
        sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      return !!(savedSession && users.some(u => u.id === savedSession));
    } catch {
      return false;
    }
  });

  const currentUser = users.find(u => u.id === currentUserId) || users[0] || INITIAL_USERS[0];

  const [pos, setPos] = useState<PurchaseOrder[]>(INITIAL_POS);
  const [rolls, setRolls] = useState<FabricRoll[]>(INITIAL_ROLLS);
  const [receives, setReceives] = useState<FabricReceiveRecord[]>(INITIAL_RECEIVES);
  const [issues, setIssues] = useState<FabricIssueRecord[]>(INITIAL_ISSUES);
  const [racks, setRacks] = useState<WarehouseRack[]>(INITIAL_RACKS);

  // Real-time synchronization with Firestore
  useEffect(() => {
    try {
      const unsubPos = onSnapshot(
        collection(db, 'pos'),
        snapshot => {
          if (!snapshot.empty) {
            const loaded = snapshot.docs.map(doc => doc.data() as PurchaseOrder);
            setPos(loaded);
          } else {
            setPos([]);
          }
        },
        error => console.error('Firestore pos error:', error)
      );

      const unsubRolls = onSnapshot(
        collection(db, 'rolls'),
        snapshot => {
          if (!snapshot.empty) {
            const loaded = snapshot.docs.map(doc => doc.data() as FabricRoll);
            setRolls(loaded);
          } else {
            setRolls([]);
          }
        },
        error => console.error('Firestore rolls error:', error)
      );

      const unsubReceives = onSnapshot(
        collection(db, 'receives'),
        snapshot => {
          if (!snapshot.empty) {
            const loaded = snapshot.docs.map(doc => doc.data() as FabricReceiveRecord);
            setReceives(loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          } else {
            setReceives([]);
          }
        },
        error => console.error('Firestore receives error:', error)
      );

      const unsubIssues = onSnapshot(
        collection(db, 'issues'),
        snapshot => {
          if (!snapshot.empty) {
            const loaded = snapshot.docs.map(doc => doc.data() as FabricIssueRecord);
            setIssues(loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          } else {
            setIssues([]);
          }
        },
        error => console.error('Firestore issues error:', error)
      );

      const unsubRacks = onSnapshot(
        collection(db, 'racks'),
        snapshot => {
          if (!snapshot.empty) {
            const loaded = snapshot.docs.map(doc => doc.data() as WarehouseRack);
            setRacks(loaded);
          } else {
            setRacks([]);
          }
        },
        error => console.error('Firestore racks error:', error)
      );

      return () => {
        unsubPos();
        unsubRolls();
        unsubReceives();
        unsubIssues();
        unsubRacks();
      };
    } catch (err) {
      console.error('Firestore sync error:', err);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  // RBAC & Auth methods
  const login = (
    identifier: string,
    password?: string,
    remember: boolean = true
  ): { success: boolean; error?: string } => {
    const trimmed = identifier.trim().toLowerCase();
    const user = users.find(
      u =>
        u.email.toLowerCase() === trimmed ||
        u.employeeId.toLowerCase() === trimmed ||
        u.name.toLowerCase() === trimmed
    );

    if (!user) {
      return {
        success: false,
        error: `No personnel account found for "${identifier}". Please use your Email or Employee ID (e.g. EMP-001 or felixstore926@gmail.com).`,
      };
    }

    if (user.status === 'Suspended') {
      return {
        success: false,
        error: 'This personnel account is currently suspended by the Master Administrator.',
      };
    }

    if (password && user.password && user.password !== password) {
      return {
        success: false,
        error: 'Incorrect password. Please verify your credentials and try again.',
      };
    }

    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    if (remember) {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, user.id);
    } else {
      sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, user.id);
    }

    setUsers(prev =>
      prev.map(u =>
        u.id === user.id
          ? { ...u, lastLogin: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) }
          : u
      )
    );

    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUserId(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  };

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUserId(userId);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, userId);
      setUsers(prev =>
        prev.map(u =>
          u.id === userId
            ? { ...u, lastLogin: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) }
            : u
        )
      );
    }
  };

  const addUser = (userData: Omit<StoreUser, 'id' | 'createdAt'>): StoreUser => {
    if (currentUser?.role !== 'master_admin') {
      alert('Access Denied: Only Master Admin is permitted to create personnel accounts or assign roles.');
      return {} as StoreUser;
    }
    const newUser: StoreUser = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastLogin: 'Never',
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (userId: string, updates: Partial<StoreUser>) => {
    if (currentUser?.role !== 'master_admin') {
      alert('Access Denied: Only Master Admin is permitted to modify user roles or permissions.');
      return;
    }
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, ...updates } : u))
    );
  };

  const deleteUser = (userId: string): boolean => {
    if (currentUser?.role !== 'master_admin') {
      alert('Access Denied: Only Master Admin is permitted to delete user accounts.');
      return false;
    }
    if (users.length <= 1) return false;
    if (userId === currentUserId) {
      const other = users.find(u => u.id !== userId);
      if (other) setCurrentUserId(other.id);
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
    return true;
  };

  const hasPermission = (permission: keyof UserPermission): boolean => {
    if (!currentUser) return false;
    // Master admin always has all permissions
    if (currentUser.role === 'master_admin') return true;
    return !!currentUser.permissions?.[permission];
  };

  // PO methods
  const addPO = (poData: Omit<PurchaseOrder, 'id' | 'createdAt'>): PurchaseOrder => {
    const newPO: PurchaseOrder = {
      ...poData,
      id: `po-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setPos(prev => [newPO, ...prev]);
    try {
      setDoc(doc(db, 'pos', newPO.id), newPO);
    } catch (e) {
      console.error(e);
    }
    return newPO;
  };

  const updatePO = (id: string, poUpdate: Partial<PurchaseOrder>) => {
    setPos(prev => {
      const updated = prev.map(p => (p.id === id ? { ...p, ...poUpdate } : p));
      const target = updated.find(p => p.id === id);
      if (target) {
        try {
          setDoc(doc(db, 'pos', id), target, { merge: true });
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });
  };

  const deletePO = (id: string): boolean => {
    // Check if rolls exist for this PO
    const targetPO = pos.find(p => p.id === id);
    if (!targetPO) return false;
    const hasRolls = rolls.some(r => r.poId === id || r.poNumber === targetPO.poNumber);
    if (hasRolls) {
      alert(`Cannot delete PO "${targetPO.poNumber}" because fabric rolls have already been received against it.`);
      return false;
    }
    setPos(prev => prev.filter(p => p.id !== id));
    try {
      setDoc(doc(db, 'pos', id), { deleted: true }); // or deleteDoc if imported
    } catch (e) {
      console.error(e);
    }
    return true;
  };

  const getPOById = (id: string) => pos.find(p => p.id === id);
  const getPOByNumber = (poNumber: string) =>
    pos.find(p => p.poNumber.trim().toLowerCase() === poNumber.trim().toLowerCase());

  // Roll Serial Number Generator
  // Serial must be strictly continuous and unique per PO:
  // If PO has R-001 through R-010, the next roll is R-011.
  const getNextRollNumberForPO = (poNumber: string, prefix = 'R-') => {
    const existingPoRolls = rolls.filter(
      r => r.poNumber.trim().toLowerCase() === poNumber.trim().toLowerCase()
    );

    if (existingPoRolls.length === 0) {
      return { rollNo: `${prefix}001`, nextIndex: 1 };
    }

    let maxIndex = 0;
    existingPoRolls.forEach(r => {
      if (r.rollIndex && r.rollIndex > maxIndex) {
        maxIndex = r.rollIndex;
      }
      // Also try regex extract in case rollIndex wasn't set on legacy data
      const match = r.rollNo.match(/\d+$/);
      if (match) {
        const parsed = parseInt(match[0], 10);
        if (!isNaN(parsed) && parsed > maxIndex) {
          maxIndex = parsed;
        }
      }
    });

    const nextIndex = maxIndex + 1;
    const formatted = `${prefix}${String(nextIndex).padStart(3, '0')}`;
    return { rollNo: formatted, nextIndex };
  };

  const getAvailableRollsForPO = (poNumber: string) => {
    return rolls.filter(
      r =>
        r.poNumber.trim().toLowerCase() === poNumber.trim().toLowerCase() &&
        r.currentWeight > 0.001 &&
        r.stockStatus !== 'Exhausted'
    );
  };

  const getRollsForPO = (poNumber: string) => {
    return rolls.filter(r => r.poNumber.trim().toLowerCase() === poNumber.trim().toLowerCase());
  };

  // Receive creation
  const createReceive = (
    receiveData: {
      receivingDate: string;
      challanNo: string;
      poNumber: string;
      supplier: string;
      receivedBy: string;
      remarks?: string;
    },
    rollItems: {
      color: string;
      fabricType: string;
      gsm: number;
      lotNo: string;
      weight: number;
      rackNo: string;
      width: string;
      qualityStatus: QualityStatus;
      shadeGrade?: string;
      remarks?: string;
    }[]
  ): FabricReceiveRecord => {
    const targetPO = getPOByNumber(receiveData.poNumber);
    const poId = targetPO ? targetPO.id : `po-custom-${Date.now()}`;
    const buyer = targetPO ? targetPO.buyer : 'General Stock';
    const style = targetPO ? targetPO.style : 'Style-N/A';
    const item = targetPO ? targetPO.item : 'Fabric-N/A';

    const receiveId = `rcv-${Date.now()}`;

    // Calculate starting index for rolls
    let { nextIndex } = getNextRollNumberForPO(receiveData.poNumber);

    const generatedRolls: FabricRoll[] = rollItems.map((itemInput, idx) => {
      const rollIndex = nextIndex + idx;
      const rollNo = `R-${String(rollIndex).padStart(3, '0')}`;
      const rollId = `roll-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`;

      return {
        id: rollId,
        poId,
        poNumber: receiveData.poNumber,
        rollNo,
        rollIndex,
        receivingId: receiveId,
        receiveDate: receiveData.receivingDate,
        challanNo: receiveData.challanNo,
        supplier: receiveData.supplier,
        buyer,
        style,
        item,
        color: itemInput.color || 'Unspecified',
        fabricType: itemInput.fabricType || 'Knit Fabric',
        gsm: Number(itemInput.gsm) || 180,
        lotNo: itemInput.lotNo || 'LOT-01',
        originalWeight: Number(itemInput.weight),
        currentWeight: Number(itemInput.weight),
        rackNo: itemInput.rackNo || 'Rack A-01',
        width: itemInput.width || '68"',
        qualityStatus: itemInput.qualityStatus || 'Approved',
        shadeGrade: itemInput.shadeGrade || 'A',
        stockStatus: 'In Stock' as StockStatus,
        remarks: itemInput.remarks || '',
      };
    });

    const totalWeight = generatedRolls.reduce((sum, r) => sum + r.originalWeight, 0);

    const newReceiveRecord: FabricReceiveRecord = {
      id: receiveId,
      receivingDate: receiveData.receivingDate,
      challanNo: receiveData.challanNo,
      poId,
      poNumber: receiveData.poNumber,
      supplier: receiveData.supplier,
      buyer,
      style,
      item,
      rolls: generatedRolls,
      totalWeight: Math.round(totalWeight * 100) / 100,
      rollCount: generatedRolls.length,
      receivedBy: receiveData.receivedBy,
      remarks: receiveData.remarks,
      createdAt: new Date().toISOString(),
    };

    // Update PO status to Receiving
    if (targetPO && targetPO.status === 'Pending') {
      updatePO(targetPO.id, { status: 'Receiving' });
    }

    setRolls(prev => [...generatedRolls, ...prev]);
    setReceives(prev => [newReceiveRecord, ...prev]);

    // Save to Firestore
    try {
      setDoc(doc(db, 'receives', newReceiveRecord.id), newReceiveRecord);
      generatedRolls.forEach(r => {
        setDoc(doc(db, 'rolls', r.id), r);
      });
    } catch (e) {
      console.error(e);
    }

    return newReceiveRecord;
  };

  // Issue creation
  const createIssue = (
    issueData: {
      issueDate: string;
      issueSlipNo: string;
      poNumber: string;
      issuedTo: string;
      issuedBy: string;
      purpose: string;
      remarks?: string;
    },
    itemsToIssue: { rollId: string; weightToIssue: number }[]
  ): FabricIssueRecord => {
    const targetPO = getPOByNumber(issueData.poNumber);
    const poId = targetPO ? targetPO.id : '';
    const buyer = targetPO ? targetPO.buyer : 'General';
    const style = targetPO ? targetPO.style : 'Style-N/A';
    const item = targetPO ? targetPO.item : 'Fabric-N/A';

    const issueId = `iss-${Date.now()}`;
    const issuedItemsDetails: FabricIssueRecord['items'] = [];
    let totalIssuedWeight = 0;

    // Clone current rolls map for updating
    const updatedRolls = rolls.map(roll => {
      const issueReq = itemsToIssue.find(i => i.rollId === roll.id);
      if (!issueReq) return roll;

      const issueKg = Math.min(issueReq.weightToIssue, roll.currentWeight);
      const remainingKg = Math.max(0, Math.round((roll.currentWeight - issueKg) * 100) / 100);
      const isFull = remainingKg <= 0.001;

      totalIssuedWeight += issueKg;

      issuedItemsDetails.push({
        rollId: roll.id,
        rollNo: roll.rollNo,
        lotNo: roll.lotNo,
        color: roll.color,
        rackNo: roll.rackNo,
        previousWeight: roll.currentWeight,
        issuedWeight: Math.round(issueKg * 100) / 100,
        remainingWeight: remainingKg,
        isFullRoll: isFull,
      });

      return {
        ...roll,
        currentWeight: remainingKg,
        stockStatus: (isFull ? 'Exhausted' : 'Partially Issued') as StockStatus,
        lastIssuedDate: issueData.issueDate,
        remarks: roll.remarks
          ? `${roll.remarks} | Issued ${issueKg}kg on ${issueData.issueDate}`
          : `Issued ${issueKg}kg on ${issueData.issueDate}`,
      };
    });

    const newIssueRecord: FabricIssueRecord = {
      id: issueId,
      issueDate: issueData.issueDate,
      issueSlipNo: issueData.issueSlipNo,
      poId,
      poNumber: issueData.poNumber,
      buyer,
      style,
      item,
      issuedTo: issueData.issuedTo,
      issuedBy: issueData.issuedBy,
      purpose: issueData.purpose,
      items: issuedItemsDetails,
      totalIssuedWeight: Math.round(totalIssuedWeight * 100) / 100,
      rollsCount: issuedItemsDetails.length,
      remarks: issueData.remarks,
      createdAt: new Date().toISOString(),
    };

    setRolls(updatedRolls);
    setIssues(prev => [newIssueRecord, ...prev]);

    // Save to Firestore
    try {
      setDoc(doc(db, 'issues', newIssueRecord.id), newIssueRecord);
      updatedRolls.forEach(r => {
        setDoc(doc(db, 'rolls', r.id), r);
      });
    } catch (e) {
      console.error(e);
    }

    return newIssueRecord;
  };

  const addRack = (rack: WarehouseRack) => {
    setRacks(prev => [...prev, rack]);
    try {
      setDoc(doc(db, 'racks', rack.id), rack);
    } catch (e) {
      console.error(e);
    }
  };

  const updateRack = (id: string, rackUpdate: Partial<WarehouseRack>) => {
    setRacks(prev => prev.map(r => (r.id === id ? { ...r, ...rackUpdate } : r)));
    const updatedRack = racks.find(r => r.id === id);
    if (updatedRack) {
      setDoc(doc(db, 'racks', id), { ...updatedRack, ...rackUpdate }, { merge: true });
    }
  };

  const transferRollRack = (rollId: string, targetRackNo: string) => {
    setRolls(prev => prev.map(r => (r.id === rollId ? { ...r, rackNo: targetRackNo } : r)));
  };

  const updateRollStatus = (rollId: string, status: QualityStatus) => {
    setRolls(prev => prev.map(r => (r.id === rollId ? { ...r, qualityStatus: status } : r)));
  };

  const createBackup = async () => {
    const backup = {
      timestamp: new Date().toISOString(),
      data: { pos, rolls, receives, issues }
    };
    await addDoc(collection(db, 'backups'), backup);
  };

  const listBackups = async () => {
    const querySnapshot = await getDocs(collection(db, 'backups'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const restoreFromBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to restore from this backup? This will overwrite current data.')) return;
    const backupDoc = await getDoc(doc(db, 'backups', backupId));
    if (!backupDoc.exists()) return;
    const { data } = backupDoc.data() as { data: { pos: any[], rolls: any[], receives: any[], issues: any[] } };

    const batch = writeBatch(db);
    // Clear existing
    const collectionsToClear = ['pos', 'rolls', 'receives', 'issues'];
    for (const colName of collectionsToClear) {
      const snapshot = await getDocs(collection(db, colName));
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
    }
    // Restore
    data.pos.forEach(p => batch.set(doc(db, 'pos', p.id), p));
    data.rolls.forEach(r => batch.set(doc(db, 'rolls', r.id), r));
    data.receives.forEach(rcv => batch.set(doc(db, 'receives', rcv.id), rcv));
    data.issues.forEach(iss => batch.set(doc(db, 'issues', iss.id), iss));

    await batch.commit();
  };

  const resetToInitialData = async () => {
    if (confirm('Are you sure you want to reset to an empty factory? This will clear all transactions. A backup will be created.')) {
      await createBackup();
      const collectionsToClear = ['pos', 'rolls', 'receives', 'issues'];
      const batch = writeBatch(db);
      for (const colName of collectionsToClear) {
        const snapshot = await getDocs(collection(db, colName));
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
      }
      await batch.commit();

      setPos([]);
      setRolls([]);
      setReceives([]);
      setIssues([]);
      
      localStorage.removeItem(STORAGE_KEYS.POS);
      localStorage.removeItem(STORAGE_KEYS.ROLLS);
      localStorage.removeItem(STORAGE_KEYS.RECEIVES);
      localStorage.removeItem(STORAGE_KEYS.ISSUES);
    }
  };

  // Automated daily backup check
  useEffect(() => {
    const checkDailyBackup = async () => {
      const today = new Date().toDateString();
      const backups = await listBackups();
      const hasBackupToday = backups.some((b: any) => new Date(b.timestamp).toDateString() === today);
      if (!hasBackupToday) {
        await createBackup();
      }
    };
    checkDailyBackup();
  }, []);

  // Compute live warehouse stats
  const now = new Date();
  let totalInStockKg = 0;
  let totalActiveRolls = 0;
  let totalExhaustedRolls = 0;
  let slowMovingKg = 0;
  let slowMovingRollsCount = 0;

  rolls.forEach(r => {
    if (r.currentWeight > 0.001) {
      totalInStockKg += r.currentWeight;
      totalActiveRolls += 1;

      // Check age for slow moving (> 60 days without full issue)
      const rcvDate = new Date(r.receiveDate);
      const diffTime = Math.abs(now.getTime() - rcvDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 60) {
        slowMovingKg += r.currentWeight;
        slowMovingRollsCount += 1;
      }
    } else {
      totalExhaustedRolls += 1;
    }
  });

  const totalReceivedKg = receives.reduce((sum, r) => sum + r.totalWeight, 0);
  const totalIssuedKg = issues.reduce((sum, i) => sum + i.totalIssuedWeight, 0);

  const stats = {
    totalInStockKg: Math.round(totalInStockKg * 10) / 10,
    totalActiveRolls,
    totalExhaustedRolls,
    totalReceivedKg: Math.round(totalReceivedKg * 10) / 10,
    totalIssuedKg: Math.round(totalIssuedKg * 10) / 10,
    totalPosCount: pos.length,
    activePosCount: pos.filter(p => p.status !== 'Closed').length,
    slowMovingKg: Math.round(slowMovingKg * 10) / 10,
    slowMovingRollsCount,
  };

  return (
    <FabricStoreContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        users,
        currentUser,
        switchUser,
        addUser,
        updateUser,
        deleteUser,
        hasPermission,
        pos,
        rolls,
        receives,
        issues,
        racks,
        addPO,
        updatePO,
        deletePO,
        getPOById,
        getPOByNumber,
        getNextRollNumberForPO,
        getAvailableRollsForPO,
        getRollsForPO,
        createReceive,
        createIssue,
        addRack,
        updateRack,
        transferRollRack,
        updateRollStatus,
        resetToInitialData,
        createBackup,
        restoreFromBackup,
        listBackups,
        stats,
      }}
    >
      {children}
    </FabricStoreContext.Provider>
  );
};

export const useFabricStore = () => {
  const context = useContext(FabricStoreContext);
  if (!context) {
    throw new Error('useFabricStore must be used within a FabricStoreProvider');
  }
  return context;
};
