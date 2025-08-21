import type { YearlyData, Family, Tithe, AggregateReportData, BialTotal, User, FamilyYearlyTitheData, YearlyFamilyTotal } from './types.ts';

// --- CONFIGURATION ---
const SIMULATED_LATENCY_MS = 200;
const DB_KEY = 'titheData';
const AUTH_TOKEN_KEY = 'authToken';
const USERS_DB_KEY = 'users';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const UPA_BIALS = Array.from({ length: 13 }, (_, i) => `Upa Bial ${i + 1}`);

// --- HELPERS ---
const simulateDelay = () => new Promise(resolve => setTimeout(resolve, SIMULATED_LATENCY_MS));

const getInitialData = (): YearlyData => {
    const currentYear = new Date().getFullYear();

    // Define family templates with persistent IDs
    const bial1FamilyTemplates = [
        { id: 'bial1-1', name: 'Lalramthara', ipSerialNo: 1 },
        { id: 'bial1-2', name: 'F. Lalbuatsaiha', ipSerialNo: 2 },
        { id: 'bial1-3', name: 'Lalramnghahlela', ipSerialNo: 3 },
        { id: 'bial1-4', name: 'Duhzuala Chawngthu', ipSerialNo: 4 },
        { id: 'bial1-5', name: 'BH Mesaia', ipSerialNo: 5 },
        { id: 'bial1-6', name: 'Lalramchuana', ipSerialNo: 6 },
        { id: 'bial1-7', name: 'Saiengliani', ipSerialNo: 7 },
        { id: 'bial1-8', name: 'Darmawii', ipSerialNo: 8 },
        { id: 'bial1-9', name: 'Felix Lalhruaitluanga', ipSerialNo: 9 },
        { id: 'bial1-10', name: 'R. Lalhmingliana', ipSerialNo: 10 },
        { id: 'bial1-11', name: 'C. Lalramchhana', ipSerialNo: 11 },
        { id: 'bial1-12', name: 'Lalhriatpuia', ipSerialNo: 12 },
        { id: 'bial1-13', name: 'Zosangpuii', ipSerialNo: 13 },
        { id: 'bial1-14', name: 'Joshua Lalmuanawma', ipSerialNo: 14 },
        { id: 'bial1-15', name: 'R. Ramluaha', ipSerialNo: 15 },
        { id: 'bial1-16', name: 'F. Lalnunpuia', ipSerialNo: 16 },
        { id: 'bial1-17', name: 'Sangkungi', ipSerialNo: 17 },
        { id: 'bial1-18', name: 'Lalchhuanawmi', ipSerialNo: 18 },
        { id: 'bial1-19', name: 'Thangbuanga Guite', ipSerialNo: 19 },
        { id: 'bial1-20', name: 'B. Ronghaki', ipSerialNo: 20 },
        { id: 'bial1-21', name: 'R. Zothanpuia', ipSerialNo: 21 },
        { id: 'bial1-22', name: 'T. Lalthlengliana', ipSerialNo: 22 },
        { id: 'bial1-23', name: 'Hauzamchingi', ipSerialNo: 23 },
        { id: 'bial1-24', name: 'C. Hranglawmi', ipSerialNo: 24 },
        { id: 'bial1-25', name: 'C. Zonunsanga', ipSerialNo: 25 },
        { id: 'bial1-26', name: 'C. Lalzova', ipSerialNo: 26 },
        { id: 'bial1-27', name: 'Lalnuntluangi', ipSerialNo: 27 }
    ];

    const bial2FamilyTemplates = [
        { id: 'bial2-1', name: 'K. Lalrawna', ipSerialNo: 1 },
        { id: 'bial2-2', name: 'Vanlalruatpuia', ipSerialNo: 2 },
        { id: 'bial2-3', name: 'Lalremruatveka', ipSerialNo: 3 },
        { id: 'bial2-4', name: 'Lalmuanpuia', ipSerialNo: 4 },
        { id: 'bial2-5', name: 'Lalniliana', ipSerialNo: 5 },
        { id: 'bial2-6', name: 'Upa B. Hranghlira', ipSerialNo: 6 },
        { id: 'bial2-7', name: 'B. Lalramnghaka', ipSerialNo: 7 },
        { id: 'bial2-8', name: 'Upa K. Vanlalhmuaka', ipSerialNo: 8 },
        { id: 'bial2-9', name: 'DS Samte', ipSerialNo: 9 },
        { id: 'bial2-10', name: 'Mungngaihsanga', ipSerialNo: 10 },
        { id: 'bial2-11', name: 'Lalramliana', ipSerialNo: 11 },
        { id: 'bial2-12', name: 'Lalniengi', ipSerialNo: 12 },
        { id: 'bial2-13', name: 'P. Lalhmingthanga', ipSerialNo: 13 },
        { id: 'bial2-14', name: 'Vanlalthupuia', ipSerialNo: 14 },
        { id: 'bial2-15', name: 'Lalnuntluanga Varte', ipSerialNo: 15 },
        { id: 'bial2-16', name: 'Lalrikhumi', ipSerialNo: 16 },
        { id: 'bial2-17', name: 'Lalnunmawii', ipSerialNo: 17 },
        { id: 'bial2-18', name: 'Sapkaii', ipSerialNo: 18 },
        { id: 'bial2-19', name: 'C. Lalrawngbawla', ipSerialNo: 19 },
        { id: 'bial2-20', name: 'Biakthansanga', ipSerialNo: 20 },
        { id: 'bial2-21', name: 'C. Lalrinfela', ipSerialNo: 21 },
        { id: 'bial2-22', name: 'C. Laltanpuia', ipSerialNo: 22 },
        { id: 'bial2-23', name: 'HS. Lalthachianga', ipSerialNo: 23 },
        { id: 'bial2-24', name: 'PC Lalhmachhuani', ipSerialNo: 24 },
        { id: 'bial2-25', name: 'R. Lalhmangaihzuali', ipSerialNo: 25 },
        { id: 'bial2-26', name: 'RL Malsawmtluangi', ipSerialNo: 26 },
        { id: 'bial2-27', name: 'Lalthankima', ipSerialNo: 27 },
        { id: 'bial2-28', name: 'S.Liansangvunga', ipSerialNo: 28 },
        { id: 'bial2-29', name: 'R.Lalremruata', ipSerialNo: 29 },
        { id: 'bial2-30', name: 'H.Lalrindika', ipSerialNo: 30 },
        { id: 'bial2-31', name: 'R.Lalrindika', ipSerialNo: 31 },
        { id: 'bial2-32', name: 'R.Lalmalsawmi', ipSerialNo: 32 },
        { id: 'bial2-33', name: 'Ramnunmawia', ipSerialNo: 33 },
        { id: 'bial2-34', name: 'Laltankima', ipSerialNo: 34 },
        { id: 'bial2-35', name: 'H Laltlanchhuaha', ipSerialNo: 35 },
        { id: 'bial2-36', name: 'Lalrosiama', ipSerialNo: 36 },
        { id: 'bial2-37', name: 'Lenchuana Jahau', ipSerialNo: 37 }
    ];

    const bial3FamilyTemplates = [
        { id: 'bial3-1', name: 'L.Khenpauva', ipSerialNo: 1 },
        { id: 'bial3-2', name: 'Evan Lalhlupuii', ipSerialNo: 2 },
        { id: 'bial3-3', name: 'Hmingthanpuii', ipSerialNo: 3 },
        { id: 'bial3-4', name: 'R.Lalremmawia', ipSerialNo: 4 },
        { id: 'bial3-5', name: 'Israela Hauhnar', ipSerialNo: 5 },
        { id: 'bial3-6', name: 'V.Nunmawii', ipSerialNo: 6 },
        { id: 'bial3-7', name: 'Lalchhandama', ipSerialNo: 7 },
        { id: 'bial3-8', name: 'Rev. Lalhmingthanga Chhangte', ipSerialNo: 8 },
        { id: 'bial3-9', name: 'Ngurbawitluangi', ipSerialNo: 9 },
        { id: 'bial3-10', name: 'Upa C.Lalthantluanga', ipSerialNo: 10 },
        { id: 'bial3-11', name: 'Nangkhanthanga', ipSerialNo: 11 },
        { id: 'bial3-12', name: 'Tluangzathanga', ipSerialNo: 12 },
        { id: 'bial3-13', name: 'VLP Zarzokima', ipSerialNo: 13 },
        { id: 'bial3-14', name: 'Manlamniangi', ipSerialNo: 14 },
        { id: 'bial3-15', name: 'Vanlalliana', ipSerialNo: 15 },
        { id: 'bial3-16', name: 'Raldomana', ipSerialNo: 16 },
        { id: 'bial3-17', name: 'Upa PC Lalhmingliana', ipSerialNo: 17 },
        { id: 'bial3-18', name: 'Laltlansanga', ipSerialNo: 18 },
        { id: 'bial3-19', name: 'Rev. Vankhuma', ipSerialNo: 19 },
        { id: 'bial3-20', name: 'PC Lalmuanpuia', ipSerialNo: 20 },
        { id: 'bial3-21', name: 'Lalnunhlima', ipSerialNo: 21 },
        { id: 'bial3-22', name: 'Lalnunengi', ipSerialNo: 22 },
        { id: 'bial3-23', name: 'Lalbawii', ipSerialNo: 23 },
        { id: 'bial3-24', name: 'Lalruatfela', ipSerialNo: 24 },
        { id: 'bial3-25', name: 'V.Lalthanzari', ipSerialNo: 25 },
        { id: 'bial3-26', name: 'Lalruatliani', ipSerialNo: 26 },
        { id: 'bial3-27', name: 'K.Lalengthanga', ipSerialNo: 27 },
        { id: 'bial3-28', name: 'Darringaii', ipSerialNo: 28 },
        { id: 'bial3-29', name: 'C.Challiana', ipSerialNo: 29 },
        { id: 'bial3-30', name: 'C.Lalfaka', ipSerialNo: 30 },
        { id: 'bial3-31', name: 'C.Vanmawia', ipSerialNo: 31 },
        { id: 'bial3-32', name: 'C. Vanlalauva', ipSerialNo: 32 },
        { id: 'bial3-33', name: 'K.Thiangina', ipSerialNo: 33 }
    ];

    const bial4FamilyTemplates = [
        { id: 'bial4-1', name: 'Suineihi', ipSerialNo: 1 },
        { id: 'bial4-2', name: 'Lalpeksanga', ipSerialNo: 2 },
        { id: 'bial4-3', name: 'R.Lalbiakzara', ipSerialNo: 3 },
        { id: 'bial4-4', name: 'T.Sangtluanga', ipSerialNo: 4 },
        { id: 'bial4-5', name: 'C.Lainguri', ipSerialNo: 5 },
        { id: 'bial4-6', name: 'Lalmuanchhungi', ipSerialNo: 6 },
        { id: 'bial4-7', name: 'H.Lalzuitluanga', ipSerialNo: 7 },
        { id: 'bial4-8', name: 'T.Chalzawna', ipSerialNo: 8 },
        // IP Serial 9 is skipped as it is empty in the source
        { id: 'bial4-10', name: 'Upa H Lalmawia', ipSerialNo: 10 },
        { id: 'bial4-11', name: 'Zoramenga', ipSerialNo: 11 },
        { id: 'bial4-12', name: 'F.Lalduhawma', ipSerialNo: 12 },
        { id: 'bial4-13', name: 'K.Lalduata', ipSerialNo: 13 },
        { id: 'bial4-14', name: 'C.Hmingthansanga', ipSerialNo: 14 },
        { id: 'bial4-15', name: 'Hmingthansanga Chhakchhuak', ipSerialNo: 15 },
        { id: 'bial4-16', name: 'Lalronguri Sailo', ipSerialNo: 16 },
        { id: 'bial4-17', name: 'Lalngaihawmi', ipSerialNo: 17 },
        { id: 'bial4-18', name: 'Lalhriatpuia', ipSerialNo: 18 },
        { id: 'bial4-19', name: 'H.Rampanliana', ipSerialNo: 19 },
        { id: 'bial4-20', name: 'K.Lalduha', ipSerialNo: 20 },
        { id: 'bial4-21', name: 'K.Lalbiakhlira', ipSerialNo: 21 },
        { id: 'bial4-22', name: 'Lalhlimpuii', ipSerialNo: 22 },
        { id: 'bial4-23', name: 'Ronald Lalhmachhuana', ipSerialNo: 23 },
        { id: 'bial4-24', name: 'Lalfakawma', ipSerialNo: 24 },
        { id: 'bial4-25', name: 'C.Lalpiangthanga', ipSerialNo: 25 },
        { id: 'bial4-26', name: 'Zalianchhiari', ipSerialNo: 26 },
        { id: 'bial4-27', name: 'Aimawii', ipSerialNo: 27 },
        { id: 'bial4-28', name: 'PC Hrangzuala', ipSerialNo: 28 },
        { id: 'bial4-29', name: 'Upa H.Zairemmawia', ipSerialNo: 29 },
        { id: 'bial4-30', name: 'Lalthangliana', ipSerialNo: 30 },
        { id: 'bial4-31', name: 'Lalthlengliana', ipSerialNo: 31 },
        { id: 'bial4-32', name: 'Vanlalfinga', ipSerialNo: 32 },
        { id: 'bial4-33', name: 'Lalhmachhuani', ipSerialNo: 33 },
        { id: 'bial4-34', name: 'Lalchungnunga', ipSerialNo: 34 },
        { id: 'bial4-35', name: 'Joseph Vanlalthanpuia', ipSerialNo: 35 },
        { id: 'bial4-36', name: 'PC.Lalthantluanga', ipSerialNo: 36 },
        { id: 'bial4-37', name: 'Zonunpari', ipSerialNo: 37 }
    ];

    const bial5FamilyTemplates = [
        { id: 'bial5-1', name: 'C Roliana', ipSerialNo: 1 },
        { id: 'bial5-2', name: 'C Zokhuma', ipSerialNo: 2 },
        { id: 'bial5-3', name: 'Zomawii', ipSerialNo: 3 },
        { id: 'bial5-4', name: 'Lalngaihzuali', ipSerialNo: 4 },
        { id: 'bial5-5', name: 'V Lalbiakzuala', ipSerialNo: 5 },
        { id: 'bial5-6', name: 'Laldinngheti', ipSerialNo: 6 },
        { id: 'bial5-7', name: 'Rohit T Zomuana', ipSerialNo: 7 },
        { id: 'bial5-8', name: 'Nicky Lalremruata', ipSerialNo: 8 },
        { id: 'bial5-9', name: 'K Sangkhuma', ipSerialNo: 9 },
        { id: 'bial5-10', name: 'Lallawmkima Fanai', ipSerialNo: 10 },
        { id: 'bial5-11', name: 'H Lalnunenga', ipSerialNo: 11 },
        { id: 'bial5-12', name: 'Ningsianniangi', ipSerialNo: 12 },
        { id: 'bial5-13', name: 'R Lalthangliana', ipSerialNo: 13 },
        { id: 'bial5-14', name: 'Khamdova', ipSerialNo: 14 },
        { id: 'bial5-15', name: 'Lalremsangi', ipSerialNo: 15 },
        { id: 'bial5-16', name: 'Zamuana', ipSerialNo: 16 },
        { id: 'bial5-17', name: 'TK Manga', ipSerialNo: 17 },
        { id: 'bial5-18', name: 'H Vanlalpeka', ipSerialNo: 18 },
        { id: 'bial5-19', name: 'H Zakima', ipSerialNo: 19 },
        { id: 'bial5-20', name: 'Christopher Lalthlamuana', ipSerialNo: 20 },
        { id: 'bial5-21', name: 'ShieldLawmthangi', ipSerialNo: 21 },
        { id: 'bial5-22', name: 'C Vanlalruata', ipSerialNo: 22 },
        { id: 'bial5-23', name: 'MC Vanlalzuii', ipSerialNo: 23 },
        { id: 'bial5-24', name: 'Remruatpuia', ipSerialNo: 24 },
        { id: 'bial5-25', name: 'Liandeihluni', ipSerialNo: 25 },
        { id: 'bial5-26', name: 'MS Dawngliana', ipSerialNo: 26 },
        { id: 'bial5-27', name: 'R Lalrintluanga', ipSerialNo: 27 },
        { id: 'bial5-28', name: 'R Ramtharnghaka', ipSerialNo: 28 },
        { id: 'bial5-29', name: 'C Malsawmdawngliana', ipSerialNo: 29 },
        { id: 'bial5-30', name: 'HB Vanlalvuana', ipSerialNo: 30 },
        { id: 'bial5-31', name: 'Zonunmawia Khiangte', ipSerialNo: 31 },
        { id: 'bial5-32', name: 'F Zawnpuithangi', ipSerialNo: 32 },
        { id: 'bial5-33', name: 'Dimlamniangi', ipSerialNo: 33 },
        { id: 'bial5-34', name: 'Kapthuama', ipSerialNo: 34 },
        { id: 'bial5-35', name: 'Zamdoliana', ipSerialNo: 35 },
        { id: 'bial5-36', name: 'Thangsianmanga', ipSerialNo: 36 },
        { id: 'bial5-37', name: 'David Thangdingliana', ipSerialNo: 37 },
        { id: 'bial5-38', name: 'Lalhriatpuii', ipSerialNo: 38 },
        { id: 'bial5-39', name: 'Lalrinawma', ipSerialNo: 39 },
        { id: 'bial5-40', name: 'Lalremsanga', ipSerialNo: 40 },
        { id: 'bial5-41', name: 'Lalbiakzuali', ipSerialNo: 41 },
    ];

    const bial6FamilyTemplates = [
        { id: 'bial6-1', name: 'Zamngaihluni', ipSerialNo: 1 },
        { id: 'bial6-2', name: 'Thangzaliana', ipSerialNo: 2 },
        { id: 'bial6-3', name: 'HT Khupa', ipSerialNo: 3 },
        { id: 'bial6-4', name: 'Lucy Nianglunzovi', ipSerialNo: 4 },
        { id: 'bial6-5', name: 'C.Keilianthanga', ipSerialNo: 5 },
        { id: 'bial6-8', name: 'Lalsawizauvi', ipSerialNo: 8 },
        { id: 'bial6-9', name: 'Rolianpuii', ipSerialNo: 9 },
        { id: 'bial6-10', name: 'Suipari', ipSerialNo: 10 },
        { id: 'bial6-11', name: 'David Thanga', ipSerialNo: 11 },
        { id: 'bial6-12', name: 'Sawngmanga', ipSerialNo: 12 },
        { id: 'bial6-13', name: 'Lalrawngbawli', ipSerialNo: 13 },
        { id: 'bial6-14', name: 'K.Malsawmi', ipSerialNo: 14 },
        { id: 'bial6-15', name: 'Lalbiakmuana', ipSerialNo: 15 },
        { id: 'bial6-16', name: 'Lalremsanga', ipSerialNo: 16 },
        { id: 'bial6-17', name: 'Vanlalrorelpuia', ipSerialNo: 17 },
        { id: 'bial6-18', name: 'C.Lalbiakthanga', ipSerialNo: 18 },
        { id: 'bial6-19', name: 'C.Lalrohlua', ipSerialNo: 19 },
        { id: 'bial6-20', name: 'C.Pangthuama', ipSerialNo: 20 },
        { id: 'bial6-21', name: 'C.Ramengmawia', ipSerialNo: 21 },
        { id: 'bial6-22', name: 'HB Lallawmsanga', ipSerialNo: 22 },
        { id: 'bial6-23', name: 'Chuauthuami', ipSerialNo: 23 },
        { id: 'bial6-24', name: 'Sapzingi', ipSerialNo: 24 },
        { id: 'bial6-25', name: 'K.Zakima', ipSerialNo: 25 },
        { id: 'bial6-26', name: 'K Lalrammawia', ipSerialNo: 26 },
        { id: 'bial6-28', name: 'Dolianthanga', ipSerialNo: 28 },
        { id: 'bial6-29', name: 'B.Kapthanzawna', ipSerialNo: 29 },
        { id: 'bial6-30', name: 'Lalhmunsangi', ipSerialNo: 30 },
        { id: 'bial6-31', name: 'PB Pachhunga', ipSerialNo: 31 },
        { id: 'bial6-32', name: 'Lalrinchhana', ipSerialNo: 32 },
        { id: 'bial6-33', name: 'C.Lalchhuanliana', ipSerialNo: 33 },
        { id: 'bial6-34', name: 'Zohmingthangi', ipSerialNo: 34 },
        { id: 'bial6-35', name: 'Lalneihmawia', ipSerialNo: 35 },
        { id: 'bial6-36', name: 'Daizavungi', ipSerialNo: 36 },
        { id: 'bial6-37', name: 'Thangneihliana', ipSerialNo: 37 },
        { id: 'bial6-38', name: 'Chinglunnuami', ipSerialNo: 38 },
        { id: 'bial6-39', name: 'Hualthangpuia', ipSerialNo: 39 },
        { id: 'bial6-40', name: 'Lalrimawia', ipSerialNo: 40 },
        { id: 'bial6-42', name: 'R Lalmuankima', ipSerialNo: 42 },
        { id: 'bial6-43', name: 'Lucy Nianglunzovi', ipSerialNo: 43 },
        { id: 'bial6-44', name: 'C Vanlalngena', ipSerialNo: 44 },
    ];

    const bial7FamilyTemplates = [
        { id: 'bial7-1', name: 'Lalramthari', ipSerialNo: 1 },
        { id: 'bial7-2', name: 'Lalthianghlima Sailo', ipSerialNo: 2 },
        { id: 'bial7-3', name: 'Saihmingliana Sailo', ipSerialNo: 3 },
        { id: 'bial7-4', name: 'Thangdeihkhupa', ipSerialNo: 4 },
        { id: 'bial7-5', name: 'Zoramgnghingliana', ipSerialNo: 5 },
        { id: 'bial7-6', name: 'Zonunsanga', ipSerialNo: 6 },
        { id: 'bial7-7', name: 'F.Lalrochhiara', ipSerialNo: 7 },
        { id: 'bial7-8', name: 'Lalramthangi', ipSerialNo: 8 },
        { id: 'bial7-9', name: 'Laltlanzova Pautu', ipSerialNo: 9 },
        { id: 'bial7-10', name: 'Lalbiakhluna', ipSerialNo: 10 },
        { id: 'bial7-11', name: 'K.Pianthanga', ipSerialNo: 11 },
        { id: 'bial7-12', name: 'Lianlamthanga', ipSerialNo: 12 },
        { id: 'bial7-13', name: 'Hmunneihthanga', ipSerialNo: 13 },
        { id: 'bial7-14', name: 'Hunlawmawma', ipSerialNo: 14 },
        { id: 'bial7-15', name: 'PC Zomuana', ipSerialNo: 15 },
        { id: 'bial7-16', name: 'Lalengzauva', ipSerialNo: 16 },
        { id: 'bial7-17', name: 'PC Lalnunsangi', ipSerialNo: 17 },
        { id: 'bial7-18', name: 'K Lalchhuanawma', ipSerialNo: 18 },
        { id: 'bial7-19', name: 'C.Rohmingliana', ipSerialNo: 19 },
        { id: 'bial7-20', name: 'Lalramhmachhuana Sailo', ipSerialNo: 20 },
        { id: 'bial7-21', name: 'K.Lalthanliana', ipSerialNo: 21 },
        { id: 'bial7-22', name: 'F.Lalremsiama', ipSerialNo: 22 },
        { id: 'bial7-23', name: 'Zothansanga', ipSerialNo: 23 },
        { id: 'bial7-24', name: 'T.Upa Lalremruata Hualngo', ipSerialNo: 24 },
        { id: 'bial7-25', name: 'Ramdinpuia', ipSerialNo: 25 },
        { id: 'bial7-26', name: 'Hrangkapkima', ipSerialNo: 26 },
        { id: 'bial7-27', name: 'C.Lianthuama', ipSerialNo: 27 },
        { id: 'bial7-28', name: 'F.Lalrosiama', ipSerialNo: 28 },
        { id: 'bial7-29', name: 'Hmangaihtluangi', ipSerialNo: 29 },
        { id: 'bial7-30', name: 'K.Lalengkima', ipSerialNo: 30 },
        { id: 'bial7-31', name: 'C.Laingura', ipSerialNo: 31 },
        { id: 'bial7-32', name: 'C.Lalhruaitluangi', ipSerialNo: 32 },
        { id: 'bial7-33', name: 'K.Vanlallampuii', ipSerialNo: 33 },
        { id: 'bial7-34', name: 'Lianngaihmani', ipSerialNo: 34 },
        { id: 'bial7-35', name: 'F.Lalnunsanga', ipSerialNo: 35 },
        { id: 'bial7-36', name: 'Lalramengmawii', ipSerialNo: 36 },
        { id: 'bial7-37', name: 'Lianngaihniangi', ipSerialNo: 37 },
        { id: 'bial7-38', name: 'C.Lalhmingmawii', ipSerialNo: 38 },
        { id: 'bial7-39', name: 'F. Hmingthanzuala', ipSerialNo: 39 },
        { id: 'bial7-40', name: 'C Vanlalngena', ipSerialNo: 40 },
        { id: 'bial7-41', name: 'Chhuanliana', ipSerialNo: 41 },
        { id: 'bial7-42', name: 'David Zamtea', ipSerialNo: 42 },
        { id: 'bial7-43', name: 'C Rinliani', ipSerialNo: 43 },
        { id: 'bial7-44', name: 'B.Lalliantawna', ipSerialNo: 44 },
        { id: 'bial7-46', name: 'Remsiamliana', ipSerialNo: 46 }
    ];

    const bial8FamilyTemplates = [
        { id: 'bial8-1', name: 'Rodinthara', ipSerialNo: 1 },
        { id: 'bial8-2', name: 'Lalchhanhima', ipSerialNo: 2 },
        { id: 'bial8-3', name: 'Rohmingthanga', ipSerialNo: 3 },
        { id: 'bial8-4', name: 'Isaac Lalrinngheta', ipSerialNo: 4 },
        { id: 'bial8-5', name: 'Helen Zothanpuii', ipSerialNo: 5 },
        { id: 'bial8-6', name: 'C Lalrinfela', ipSerialNo: 6 },
        { id: 'bial8-7', name: 'Lalrohlupuii', ipSerialNo: 7 },
        { id: 'bial8-8', name: 'B Lalrinenga', ipSerialNo: 8 },
        { id: 'bial8-9', name: 'Vanlalauva', ipSerialNo: 9 },
        { id: 'bial8-10', name: 'Lalrindika', ipSerialNo: 10 },
        { id: 'bial8-11', name: 'K.Vanengmawia', ipSerialNo: 11 },
        { id: 'bial8-12', name: 'PC Malsawmtluanga', ipSerialNo: 12 },
        { id: 'bial8-13', name: 'H Lalthlengkima', ipSerialNo: 13 },
        { id: 'bial8-14', name: 'C.Vanlalduha', ipSerialNo: 14 },
        { id: 'bial8-15', name: 'R.Pukhuma', ipSerialNo: 15 },
        { id: 'bial8-16', name: 'Lalengkima', ipSerialNo: 16 },
        { id: 'bial8-17', name: 'Upa HT Vanlalsawma', ipSerialNo: 17 },
        { id: 'bial8-18', name: 'C.Lalengmawia', ipSerialNo: 18 },
        { id: 'bial8-19', name: 'Ginlungmuana', ipSerialNo: 19 },
        { id: 'bial8-20', name: 'C.Lalrammawia', ipSerialNo: 20 },
        { id: 'bial8-21', name: 'Lalbiaklawma', ipSerialNo: 21 },
        { id: 'bial8-22', name: 'Laldingngheta', ipSerialNo: 22 },
        { id: 'bial8-23', name: 'Lalnuntluanga', ipSerialNo: 23 },
        { id: 'bial8-24', name: 'Rodawla', ipSerialNo: 24 },
        { id: 'bial8-25', name: 'Lalhmingvuli', ipSerialNo: 25 },
        { id: 'bial8-26', name: 'JC Laldinthara', ipSerialNo: 26 },
        { id: 'bial8-27', name: 'C.Lianhnuna', ipSerialNo: 27 },
        { id: 'bial8-28', name: 'T.Thlamuana', ipSerialNo: 28 },
        { id: 'bial8-29', name: 'Laltlanthangi', ipSerialNo: 29 },
        { id: 'bial8-30', name: 'T.Lalramnghaka', ipSerialNo: 30 },
        { id: 'bial8-31', name: 'Zorammuani', ipSerialNo: 31 },
        { id: 'bial8-32', name: 'C.Lalthlamuana', ipSerialNo: 32 },
        { id: 'bial8-33', name: 'Lallawmzuali', ipSerialNo: 33 },
        { id: 'bial8-34', name: 'C.Rokima', ipSerialNo: 34 },
        { id: 'bial8-35', name: 'Challianmawii', ipSerialNo: 35 },
        { id: 'bial8-36', name: 'Lalthlangzela', ipSerialNo: 36 },
        { id: 'bial8-37', name: 'Rangthanmawii', ipSerialNo: 37 },
        { id: 'bial8-38', name: 'TC Vanlalchuana', ipSerialNo: 38 },
        { id: 'bial8-39', name: 'Ramthianghlima', ipSerialNo: 39 },
    ];

    const bial9FamilyTemplates = [
        { id: 'bial9-1', name: 'CF Lalramnghaka', ipSerialNo: 1 },
        { id: 'bial9-2', name: 'Ramdinsanga', ipSerialNo: 2 },
        { id: 'bial9-3', name: 'Upa R Lalramhluna', ipSerialNo: 3 },
        { id: 'bial9-4', name: 'Lalnuntluangi Ralte', ipSerialNo: 4 },
        { id: 'bial9-5', name: 'Buaithanga', ipSerialNo: 5 },
        { id: 'bial9-6', name: 'Malsawmi Tlau', ipSerialNo: 6 },
        { id: 'bial9-7', name: 'F Lalhriatpuia', ipSerialNo: 7 },
        { id: 'bial9-8', name: 'H Zahmingliana', ipSerialNo: 8 },
        { id: 'bial9-9', name: 'Hmingthanzauva Chhangte', ipSerialNo: 9 },
        { id: 'bial9-10', name: 'K Lalhlira', ipSerialNo: 10 },
        { id: 'bial9-11', name: 'Zobiakzuali', ipSerialNo: 11 },
        { id: 'bial9-12', name: 'Lalremmawia', ipSerialNo: 12 },
        { id: 'bial9-13', name: 'Thanhlira', ipSerialNo: 13 },
        { id: 'bial9-14', name: 'PC Lalchhuangkima', ipSerialNo: 14 },
        { id: 'bial9-15', name: 'Gochingi', ipSerialNo: 15 },
        { id: 'bial9-16', name: 'Nginmuansanga', ipSerialNo: 16 },
        { id: 'bial9-17', name: 'JH Kapluaia', ipSerialNo: 17 },
        { id: 'bial9-18', name: 'Zokimi', ipSerialNo: 18 },
        { id: 'bial9-19', name: 'Lalhmingmawia', ipSerialNo: 19 },
        { id: 'bial9-20', name: 'PC Zoramthanga', ipSerialNo: 20 },
        { id: 'bial9-21', name: 'Thalianchhungi', ipSerialNo: 21 },
        { id: 'bial9-22', name: 'Kawlthangpuii', ipSerialNo: 22 },
        { id: 'bial9-23', name: 'Kapmunga', ipSerialNo: 23 },
        { id: 'bial9-24', name: 'John Vanlalremruata', ipSerialNo: 24 },
        { id: 'bial9-25', name: 'Hrinkama', ipSerialNo: 25 },
        { id: 'bial9-26', name: 'Langkhanpauva', ipSerialNo: 26 },
        { id: 'bial9-27', name: 'C Lalchhanhima', ipSerialNo: 27 },
        { id: 'bial9-28', name: 'F Lalchhuanpuia', ipSerialNo: 28 },
        { id: 'bial9-29', name: 'Lalchungnungi', ipSerialNo: 29 },
        { id: 'bial9-30', name: 'K Lalduhawma', ipSerialNo: 30 },
        { id: 'bial9-31', name: 'Vanlalhriata', ipSerialNo: 31 },
        { id: 'bial9-32', name: 'K Thuamluaia', ipSerialNo: 32 },
        { id: 'bial9-33', name: 'Isak Lalengkima', ipSerialNo: 33 },
        { id: 'bial9-34', name: 'Nelson Khiangte', ipSerialNo: 34 },
        { id: 'bial9-35', name: 'Kamtinmanga', ipSerialNo: 35 },
        { id: 'bial9-36', name: 'Tlangthanmawia', ipSerialNo: 36 },
        { id: 'bial9-37', name: 'B Zelkhangova', ipSerialNo: 37 },
        { id: 'bial9-38', name: 'Tuanzopianga', ipSerialNo: 38 },
        { id: 'bial9-39', name: 'Pensionliana', ipSerialNo: 39 },
        { id: 'bial9-40', name: 'Lalhmunliana', ipSerialNo: 40 },
        { id: 'bial9-41', name: 'Larchhuakmawia', ipSerialNo: 41 },
        { id: 'bial9-42', name: 'Rochhuanawma', ipSerialNo: 42 },
        { id: 'bial9-43', name: 'Rundinthuama', ipSerialNo: 43 },
        { id: 'bial9-44', name: 'MS Dawngzela', ipSerialNo: 44 }
    ];

    const bial10FamilyTemplates = [
        { id: 'bial10-1', name: 'Lalroenga', ipSerialNo: 1 },
        { id: 'bial10-2', name: 'Lianzatuanga', ipSerialNo: 2 },
        { id: 'bial10-3', name: 'Lianmawii', ipSerialNo: 3 },
        { id: 'bial10-4', name: 'Lalmuanpuia', ipSerialNo: 4 },
        { id: 'bial10-5', name: 'Rualkhumi', ipSerialNo: 5 },
        { id: 'bial10-6', name: 'Thangsuanliana', ipSerialNo: 6 },
        { id: 'bial10-7', name: 'Lalramdinthara', ipSerialNo: 7 },
        { id: 'bial10-8', name: 'Lalbiakhnuni', ipSerialNo: 8 },
        { id: 'bial10-9', name: 'K.Lalkhumliana', ipSerialNo: 9 },
        { id: 'bial10-10', name: 'Lalnunthanga', ipSerialNo: 10 },
        { id: 'bial10-11', name: 'Vardingliana', ipSerialNo: 11 },
        { id: 'bial10-12', name: 'Zomuanpuia', ipSerialNo: 12 },
        { id: 'bial10-13', name: 'HT Lalmalsawma', ipSerialNo: 13 },
        { id: 'bial10-14', name: 'H.Vanlalthanga', ipSerialNo: 14 },
        { id: 'bial10-15', name: 'Lalmuanpuia Ralte', ipSerialNo: 15 },
        { id: 'bial10-16', name: 'Upa David Lalchhanhima', ipSerialNo: 16 },
        { id: 'bial10-17', name: 'Lalnunziri', ipSerialNo: 17 },
        { id: 'bial10-18', name: 'Kamdingliana Sailo', ipSerialNo: 18 },
    ];
    
    const bial11FamilyTemplates = [
        { id: 'bial11-1', name: 'Siamthangpuii', ipSerialNo: 1 },
        { id: 'bial11-2', name: 'Zohmingmawia Pachuau', ipSerialNo: 2 },
        { id: 'bial11-3', name: 'C Darrothanga', ipSerialNo: 3 },
        { id: 'bial11-4', name: 'Lalliannguauva Sailo', ipSerialNo: 4 },
        { id: 'bial11-5', name: 'Upa G Vanlallawma', ipSerialNo: 5 },
        { id: 'bial11-6', name: 'Dawngsuanpauva', ipSerialNo: 6 },
        { id: 'bial11-7', name: 'Sutliansawma', ipSerialNo: 7 },
        { id: 'bial11-8', name: 'Singzakapa', ipSerialNo: 8 },
        { id: 'bial11-9', name: 'J Laldawngliana', ipSerialNo: 9 },
        { id: 'bial11-10', name: 'J Laldinliana', ipSerialNo: 10 },
        { id: 'bial11-11', name: 'Biaksangpuii', ipSerialNo: 11 },
        { id: 'bial11-12', name: 'C Lalfakzuala', ipSerialNo: 12 },
        { id: 'bial11-13', name: 'V Kaizasiama', ipSerialNo: 13 },
        { id: 'bial11-14', name: 'V Lalpianga', ipSerialNo: 14 },
        { id: 'bial11-15', name: 'V Lalbiakdika', ipSerialNo: 15 },
        { id: 'bial11-16', name: 'Rotluangi', ipSerialNo: 16 },
        { id: 'bial11-17', name: 'T Zonundanga', ipSerialNo: 17 },
        { id: 'bial11-18', name: 'Lalbiakmuana', ipSerialNo: 18 },
        { id: 'bial11-19', name: 'Thangvankima', ipSerialNo: 19 },
        { id: 'bial11-20', name: 'Laldinpuia', ipSerialNo: 20 },
        { id: 'bial11-21', name: 'Pauginliana', ipSerialNo: 21 },
        { id: 'bial11-22', name: 'Lalthanghulha', ipSerialNo: 22 },
        { id: 'bial11-23', name: 'Thangmangliana', ipSerialNo: 23 },
        { id: 'bial11-24', name: 'Hmingthanmawii', ipSerialNo: 24 },
        { id: 'bial11-25', name: 'C Chhinghnema', ipSerialNo: 25 },
        { id: 'bial11-26', name: 'Thaneihluti', ipSerialNo: 26 },
        { id: 'bial11-27', name: 'C Laitanga', ipSerialNo: 27 },
        { id: 'bial11-28', name: 'Zarzoliani', ipSerialNo: 28 },
        { id: 'bial11-29', name: 'Lalhmangaihi', ipSerialNo: 29 },
        { id: 'bial11-30', name: 'Dimzaniangi', ipSerialNo: 30 },
        { id: 'bial11-31', name: 'Chingzaniangi', ipSerialNo: 31 },
        { id: 'bial11-32', name: 'Kapkhansanga', ipSerialNo: 32 },
        { id: 'bial11-33', name: 'Lalmuanpuii', ipSerialNo: 33 },
        { id: 'bial11-34', name: 'PL Zawmliana', ipSerialNo: 34 },
        { id: 'bial11-35', name: 'Rohlupuii', ipSerialNo: 35 },
    ];
    
    const bial12FamilyTemplates = [
        { id: 'bial12-1', name: 'Hminglianchhunga', ipSerialNo: 1 },
        { id: 'bial12-2', name: 'Dalliandawnga', ipSerialNo: 2 },
        { id: 'bial12-3', name: 'Dimluanchingi', ipSerialNo: 3 },
        { id: 'bial12-4', name: 'Vungzalanga', ipSerialNo: 4 },
        { id: 'bial12-5', name: 'Paukhanhauva', ipSerialNo: 5 },
        { id: 'bial12-6', name: 'Dimdeihsiani', ipSerialNo: 6 },
        { id: 'bial12-7', name: 'Manngaihliani', ipSerialNo: 7 },
        { id: 'bial12-8', name: 'Chinzakapa', ipSerialNo: 8 },
        { id: 'bial12-9', name: 'Thangngaihpianga', ipSerialNo: 9 },
        { id: 'bial12-10', name: 'Chingngaihzami', ipSerialNo: 10 },
        { id: 'bial12-11', name: 'Paupiansiama', ipSerialNo: 11 },
        { id: 'bial12-12', name: 'Pausianmuanga', ipSerialNo: 12 },
        { id: 'bial12-13', name: 'Nangsatinvela', ipSerialNo: 13 },
        { id: 'bial12-14', name: 'C Lalrohlua', ipSerialNo: 14 },
        { id: 'bial12-15', name: 'Chingngaihkimi', ipSerialNo: 15 },
        { id: 'bial12-16', name: 'Nangkapliana', ipSerialNo: 16 },
        { id: 'bial12-17', name: 'Niangsuanmanga', ipSerialNo: 17 },
        { id: 'bial12-18', name: 'Chinlamthanga', ipSerialNo: 18 },
        { id: 'bial12-19', name: 'Chingdeihthangi', ipSerialNo: 19 },
        { id: 'bial12-20', name: 'T.Sawmpauva', ipSerialNo: 20 },
        { id: 'bial12-21', name: 'Thangliankama', ipSerialNo: 21 },
        { id: 'bial12-22', name: 'Thangvunga', ipSerialNo: 22 },
        { id: 'bial12-23', name: 'Pauthanmawia', ipSerialNo: 23 },
        { id: 'bial12-24', name: 'Chinlianmawii', ipSerialNo: 24 },
        { id: 'bial12-25', name: 'Chingdawnmangi', ipSerialNo: 25 },
        { id: 'bial12-26', name: 'Thanglamkimi', ipSerialNo: 26 },
        { id: 'bial12-27', name: 'Pauneihchina', ipSerialNo: 27 },
        { id: 'bial12-28', name: 'Upa Daikhawzama', ipSerialNo: 28 },
        { id: 'bial12-29', name: 'Paungaihtuanga', ipSerialNo: 29 },
        { id: 'bial12-30', name: 'F.Lalhunmawia', ipSerialNo: 30 },
    ];
    
    const bial13FamilyTemplates = [
        { id: 'bial13-1', name: 'C Lalbiaksanga', ipSerialNo: 1 },
        { id: 'bial13-2', name: 'Zamsianthanga', ipSerialNo: 2 },
        { id: 'bial13-3', name: 'Niangdeihmani', ipSerialNo: 3 },
        { id: 'bial13-4', name: 'Thangdeihchina', ipSerialNo: 4 },
        { id: 'bial13-5', name: 'Sutzamunga', ipSerialNo: 5 },
        { id: 'bial13-6', name: 'Dawnglamthanga', ipSerialNo: 6 },
        { id: 'bial13-7', name: 'Suanzasiama', ipSerialNo: 7 },
        { id: 'bial13-8', name: 'B.Lalbiaklawma', ipSerialNo: 8 },
        { id: 'bial13-9', name: 'Dalsiankhama', ipSerialNo: 9 },
        { id: 'bial13-10', name: 'Pauneihthanga', ipSerialNo: 10 },
        { id: 'bial13-11', name: 'Nangzasuana', ipSerialNo: 11 },
        { id: 'bial13-12', name: 'Khupzatuanga', ipSerialNo: 12 },
        { id: 'bial13-13', name: 'Langkhansuana', ipSerialNo: 13 },
        { id: 'bial13-14', name: 'Roengi', ipSerialNo: 14 },
        { id: 'bial13-15', name: 'Keilingthanga', ipSerialNo: 15 },
        { id: 'bial13-17', name: 'Zenngaihdimi', ipSerialNo: 17 },
        { id: 'bial13-18', name: 'Ginsuanpianga', ipSerialNo: 18 },
        { id: 'bial13-19', name: 'Khamliana', ipSerialNo: 19 },
        { id: 'bial13-20', name: 'Engthangkima', ipSerialNo: 20 },
        { id: 'bial13-21', name: 'Tawnliana', ipSerialNo: 21 },
        { id: 'bial13-22', name: 'Chingsianmani', ipSerialNo: 22 },
        { id: 'bial13-23', name: 'Ningzavungi', ipSerialNo: 23 },
        { id: 'bial13-24', name: 'Thangngaihkama', ipSerialNo: 24 },
        { id: 'bial13-25', name: 'Lianzakhaia', ipSerialNo: 25 },
        { id: 'bial13-26', name: 'Ninglianchini', ipSerialNo: 26 },
        { id: 'bial13-27', name: 'Chingngaihniangi', ipSerialNo: 27 },
        { id: 'bial13-28', name: 'Lalmuana', ipSerialNo: 28 },
        { id: 'bial13-29', name: 'Malsawmthangi', ipSerialNo: 29 },
    ];


    const yearlyData: YearlyData = { [currentYear]: {} };

    // Create entries for all months for the current year
    MONTHS.forEach(month => {
        // For each month, create a fresh list of families for Bial 1 with zero tithes
        const bial1Families = bial1FamilyTemplates.map(family => ({
            ...family,
            tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 }
        }));
        
        const bial2Families = bial2FamilyTemplates.map(family => ({
            ...family,
            tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 }
        }));
        
        const bial3Families = bial3FamilyTemplates.map(family => ({
            ...family,
            tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 }
        }));

        const bial4Families = bial4FamilyTemplates.map(family => ({
            ...family,
            tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 }
        }));

        const bial5Families = bial5FamilyTemplates.map(family => ({
            ...family,
            tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 }
        }));

        const bial6Families = bial6FamilyTemplates.map(family => ({
            ...family,
            tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 }
        }));

        const bial7Families = bial7FamilyTemplates.map(family => ({
            ...family,
            tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 }
        }));

        const bial8Families = bial8FamilyTemplates.map(family => ({
            ...family,
            tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 }
        }));

        const bial9Families = bial9FamilyTemplates.map(family => ({
            ...family,
            tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 }
        }));

        const bial10Families = bial10FamilyTemplates.map(family => ({
            ...family,
            tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 }
        }));

        const bial11Families = bial11FamilyTemplates.map(family => ({
            ...family,
            tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 }
        }));

        const bial12Families = bial12FamilyTemplates.map(family => ({
            ...family,
            tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 }
        }));

        const bial13Families = bial13FamilyTemplates.map(family => ({
            ...family,
            tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 }
        }));

        yearlyData[currentYear][month] = {
            "Upa Bial 1": bial1Families,
            "Upa Bial 2": bial2Families,
            "Upa Bial 3": bial3Families,
            "Upa Bial 4": bial4Families,
            "Upa Bial 5": bial5Families,
            "Upa Bial 6": bial6Families,
            "Upa Bial 7": bial7Families,
            "Upa Bial 8": bial8Families,
            "Upa Bial 9": bial9Families,
            "Upa Bial 10": bial10Families,
            "Upa Bial 11": bial11Families,
            "Upa Bial 12": bial12Families,
            "Upa Bial 13": bial13Families,
        };
    });
    
    return yearlyData;
};

const getDatabase = (): YearlyData => {
    try {
        const data = localStorage.getItem(DB_KEY);
        if (data) {
            return JSON.parse(data);
        }
        const initialData = getInitialData();
        localStorage.setItem(DB_KEY, JSON.stringify(initialData));
        return initialData;
    } catch (error) {
        console.error("Could not access localStorage. Using in-memory data.", error);
        return getInitialData();
    }
};

const saveDatabase = (db: YearlyData) => {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (error) {
        console.error("Could not save to localStorage.", error);
    }
};


// --- DATA API ---

export const fetchFamilies = async (year: number, month: string, upaBial: string): Promise<Family[]> => {
    await simulateDelay();
    const db = getDatabase();
    return db[year]?.[month]?.[upaBial] ?? [];
};

export const addFamily = async (year: number, month: string, upaBial: string, name: string): Promise<Family> => {
    await simulateDelay();
    const db = getDatabase();
    const trimmedName = name.trim();

    if (!db[year]) db[year] = {};

    // Check for existing family name in this Upa Bial for the given year
    for (const m of MONTHS) {
        if (db[year][m]?.[upaBial]?.some(f => f.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
            throw new Error(`Family "${trimmedName}" already exists in ${upaBial} for ${year}.`);
        }
    }
    
    const familyId = new Date().getTime().toString();
    const familyToAdd: Omit<Family, 'tithe'> = {
        id: familyId,
        name: trimmedName,
        ipSerialNo: null,
    };

    MONTHS.forEach(m => {
        if (!db[year][m]) db[year][m] = {};
        if (!db[year][m][upaBial]) db[year][m][upaBial] = [];
        
        const newFamilyForMonth: Family = {
            ...familyToAdd,
            tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 },
        };
        db[year][m][upaBial].push(newFamilyForMonth);
    });
    
    saveDatabase(db);
    
    const addedFamily = db[year][month][upaBial].find(f => f.id === familyId);
    if (!addedFamily) throw new Error("Failed to add family"); // Should not happen
    return addedFamily;
};


export const importFamilies = async (year: number, month: string, upaBial: string, names: string[]): Promise<{added: number, skipped: number}> => {
    await simulateDelay();
    const db = getDatabase();
    
    if (!db[year]) db[year] = {};

    const existingNames = new Set<string>();
    MONTHS.forEach(m => {
        if (db[year][m]?.[upaBial]) {
            db[year][m][upaBial].forEach(f => existingNames.add(f.name.trim().toLowerCase()));
        }
    });

    const uniqueNames = [...new Set(names.map(name => name.trim()).filter(Boolean))];

    const familiesToCreate: string[] = [];
    const familiesToSkip: string[] = [];

    uniqueNames.forEach(name => {
        if (existingNames.has(name.toLowerCase())) {
            familiesToSkip.push(name);
        } else {
            familiesToCreate.push(name);
            existingNames.add(name.toLowerCase()); // Add to set to handle duplicates within the import list itself
        }
    });

    if (familiesToCreate.length === 0) {
        return { added: 0, skipped: uniqueNames.length };
    }

    const newFamiliesData = familiesToCreate.map(name => ({
        id: `${new Date().getTime()}-${name}-${Math.random()}`,
        name,
        ipSerialNo: null
    }));

    MONTHS.forEach(m => {
        if (!db[year][m]) db[year][m] = {};
        if (!db[year][m][upaBial]) db[year][m][upaBial] = [];

        const familiesForMonth = newFamiliesData.map(f => ({
            ...f,
            tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 }
        }));

        db[year][m][upaBial].push(...familiesForMonth);
    });

    saveDatabase(db);
    return { added: familiesToCreate.length, skipped: familiesToSkip.length };
};

export const updateFamily = async (year: number, month: string, upaBial: string, familyId: string, updatedData: Partial<Family>): Promise<Family> => {
    await simulateDelay();
    const db = getDatabase();

    if (!db[year]) throw new Error("Year not found");

    const hasSharedDataUpdate = 'name' in updatedData || 'ipSerialNo' in updatedData;
    let returnedFamily: Family | null = null;

    if (hasSharedDataUpdate) {
        // If name is being updated, check for duplicates first
        if ('name' in updatedData && updatedData.name) {
            const newName = updatedData.name.trim().toLowerCase();
            for (const m of MONTHS) {
                if (db[year][m]?.[upaBial]?.some(f => f.id !== familyId && f.name.trim().toLowerCase() === newName)) {
                    throw new Error(`Another family with the name "${updatedData.name}" already exists.`);
                }
            }
        }

        // Propagate name and ipSerialNo changes to all months
        MONTHS.forEach(m => {
            if (db[year][m]?.[upaBial]) {
                const familyIndex = db[year][m][upaBial].findIndex(f => f.id === familyId);
                if (familyIndex !== -1) {
                    const familyToUpdate = db[year][m][upaBial][familyIndex];
                    const newFamilyData = { ...familyToUpdate, ...updatedData };
                    db[year][m][upaBial][familyIndex] = newFamilyData;
                    
                    if (m === month) {
                        returnedFamily = newFamilyData;
                    }
                }
            }
        });
    } else {
        // Only update tithe for the specific month
        const families = db[year]?.[month]?.[upaBial] ?? [];
        const familyIndex = families.findIndex(f => f.id === familyId);

        if (familyIndex === -1) throw new Error("Family not found");

        const updatedFamily = { ...families[familyIndex], ...updatedData };
        families[familyIndex] = updatedFamily;
        db[year][month][upaBial] = families;
        returnedFamily = updatedFamily;
    }

    if (!returnedFamily) throw new Error("Family not found to update.");

    saveDatabase(db);
    return returnedFamily;
};

export const removeFamily = async (year: number, month: string, upaBial: string, familyId: string): Promise<void> => {
    await simulateDelay();
    const db = getDatabase();
    if (!db[year]) return;

    MONTHS.forEach(m => {
        if (db[year][m]?.[upaBial]) {
            db[year][m][upaBial] = db[year][m][upaBial].filter(f => f.id !== familyId);
        }
    });

    saveDatabase(db);
};

export const transferFamily = async (year: number, familyId: string, sourceUpaBial: string, destinationUpaBial: string): Promise<void> => {
    await simulateDelay();
    const db = getDatabase();

    if (!db[year]) throw new Error(`Data for year ${year} not found.`);
    if (sourceUpaBial === destinationUpaBial) throw new Error("Source and destination bial cannot be the same.");

    let familyToTransfer: Family | null = null;

    // Find the family in any month to get their details
    for (const month of MONTHS) {
        const family = db[year][month]?.[sourceUpaBial]?.find(f => f.id === familyId);
        if (family) {
            familyToTransfer = family;
            break;
        }
    }

    if (!familyToTransfer) {
        throw new Error("Family to transfer not found in the source bial for the selected year.");
    }
    
    // Check for name conflict in the destination bial for the entire year
    for (const month of MONTHS) {
        const destinationFamilies = db[year][month]?.[destinationUpaBial] ?? [];
        if (destinationFamilies.some(f => f.name.trim().toLowerCase() === familyToTransfer!.name.trim().toLowerCase())) {
            throw new Error(`A family named "${familyToTransfer!.name}" already exists in ${destinationUpaBial}.`);
        }
    }

    // Perform the transfer for all months
    MONTHS.forEach(month => {
        const sourceFamilies = db[year][month]?.[sourceUpaBial];
        if (sourceFamilies) {
            const familyIndex = sourceFamilies.findIndex(f => f.id === familyId);
            if (familyIndex !== -1) {
                const [movedFamily] = sourceFamilies.splice(familyIndex, 1);

                // Ensure the destination bial array exists
                if (!db[year][month][destinationUpaBial]) {
                    db[year][month][destinationUpaBial] = [];
                }
                db[year][month][destinationUpaBial].push(movedFamily);
            }
        }
    });

    saveDatabase(db);
};


// --- REPORTING API ---
export const fetchMonthlyReport = async (year: number, month: string): Promise<AggregateReportData> => {
    await simulateDelay();
    const db = getDatabase();
    const monthData = db[year]?.[month];
    if (!monthData) return {};
    
    const report: AggregateReportData = {};
    UPA_BIALS.forEach(bial => {
      const families = monthData[bial] ?? [];
      const bialTotal = families.reduce<BialTotal>((acc, family) => {
        acc.pathianRam += family.tithe.pathianRam;
        acc.ramthar += family.tithe.ramthar;
        acc.tualchhung += family.tithe.tualchhung;
        acc.total += family.tithe.pathianRam + family.tithe.ramthar + family.tithe.tualchhung;
        return acc;
      }, { pathianRam: 0, ramthar: 0, tualchhung: 0, total: 0 });
      if (bialTotal.total > 0) report[bial] = bialTotal;
    });
    return report;
};

export const fetchYearlyReport = async (year: number): Promise<AggregateReportData> => {
    await simulateDelay();
    const db = getDatabase();
    const yearData = db[year];
    if (!yearData) return {};

    const report: AggregateReportData = {};
    UPA_BIALS.forEach(bial => {
        const bialTotalForYear: BialTotal = { pathianRam: 0, ramthar: 0, tualchhung: 0, total: 0 };
        MONTHS.forEach(month => {
            const families = yearData[month]?.[bial] ?? [];
            families.forEach(family => {
                bialTotalForYear.pathianRam += family.tithe.pathianRam;
                bialTotalForYear.ramthar += family.tithe.ramthar;
                bialTotalForYear.tualchhung += family.tithe.tualchhung;
                bialTotalForYear.total += family.tithe.pathianRam + family.tithe.ramthar + family.tithe.tualchhung;
            });
        });
        if (bialTotalForYear.total > 0) report[bial] = bialTotalForYear;
    });
    return report;
};

export const fetchFamilyYearlyData = async (year: number, familyId: string): Promise<{ data: FamilyYearlyTitheData, familyInfo: { name: string, ipSerialNo: number | null, upaBial: string } }> => {
    await simulateDelay();
    const db = getDatabase();
    const yearData = db[year];

    if (!yearData) throw new Error("No data found for the selected year.");

    const yearlyData: FamilyYearlyTitheData = {};
    let familyInfo: { name: string, ipSerialNo: number | null, upaBial: string } | null = null;
    
    // Find the family in any month to get their static info and Upa Bial
    for (const month of MONTHS) {
        if (yearData[month]) {
            for (const upaBial of UPA_BIALS) {
                const family = yearData[month][upaBial]?.find(f => f.id === familyId);
                if (family) {
                    familyInfo = { name: family.name, ipSerialNo: family.ipSerialNo, upaBial: upaBial };
                    break;
                }
            }
        }
        if (familyInfo) break;
    }

    if (!familyInfo) throw new Error("Family not found in the selected year.");
    
    // Now that we know the Upa Bial, we can collect data more efficiently
    MONTHS.forEach(month => {
        const family = yearData[month]?.[familyInfo!.upaBial]?.find(f => f.id === familyId);
        yearlyData[month] = family ? family.tithe : { pathianRam: 0, ramthar: 0, tualchhung: 0 };
    });

    return { data: yearlyData, familyInfo };
};

export const fetchBialYearlyFamilyData = async (year: number, upaBial: string): Promise<YearlyFamilyTotal[]> => {
    await simulateDelay();
    const db = getDatabase();
    const yearData = db[year];

    if (!yearData) return [];

    const familyTotals: { [familyId: string]: YearlyFamilyTotal } = {};

    MONTHS.forEach(month => {
        const familiesInMonth = yearData[month]?.[upaBial] ?? [];

        familiesInMonth.forEach(family => {
            if (!familyTotals[family.id]) {
                familyTotals[family.id] = {
                    id: family.id,
                    name: family.name,
                    ipSerialNo: family.ipSerialNo,
                    tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 },
                };
            }
            // Update name and serial in case it changed during the year.
            // This takes the value from the latest month processed.
            familyTotals[family.id].name = family.name;
            familyTotals[family.id].ipSerialNo = family.ipSerialNo;

            familyTotals[family.id].tithe.pathianRam += family.tithe.pathianRam;
            familyTotals[family.id].tithe.ramthar += family.tithe.ramthar;
            familyTotals[family.id].tithe.tualchhung += family.tithe.tualchhung;
        });
    });

    return Object.values(familyTotals).sort((a, b) => (a.ipSerialNo ?? Infinity) - (b.ipSerialNo ?? Infinity));
};


// --- AUTH API ---

const getUsers = (): User[] => {
    try {
        const usersJson = localStorage.getItem(USERS_DB_KEY);
        let users: User[] = usersJson ? JSON.parse(usersJson) : [];
        let hasChanges = false;

        // --- Admin User ---
        let adminUser = users.find(u => u.phone === 'admin');
        if (!adminUser) {
            // Add if doesn't exist
            users.push({ id: '1', name: 'Admin', phone: 'admin', passwordHash: 'admin', assignedBial: null });
            hasChanges = true;
        } else {
            // Correct if exists but is wrong
            if (adminUser.passwordHash !== 'admin' || adminUser.assignedBial !== null) {
                adminUser.passwordHash = 'admin';
                adminUser.assignedBial = null;
                hasChanges = true;
            }
        }

        // --- Bial Manager Users ---
        for (let i = 1; i <= 13; i++) {
            const bialPhone = `bial${i}`;
            const bialName = `Upa Bial ${i}`;
            const bialPassword = `bial${i}`; // password is same as username

            let bialUser = users.find(u => u.phone === bialPhone);
            if (!bialUser) {
                // Add if doesn't exist
                users.push({
                    id: `bial-${i}`,
                    name: `${bialName} Manager`,
                    phone: bialPhone,
                    passwordHash: bialPassword,
                    assignedBial: bialName
                });
                hasChanges = true;
            } else {
                // Correct if exists but is wrong
                if (bialUser.passwordHash !== bialPassword || bialUser.assignedBial !== bialName) {
                    bialUser.passwordHash = bialPassword;
                    bialUser.assignedBial = bialName;
                    hasChanges = true;
                }
            }
        }
        
        // Save back to localStorage ONLY if there were changes or if it was the first run
        if(hasChanges || !usersJson) {
            localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
        }
        
        return users;

    } catch (error) {
        console.error("Error managing users database, resetting to defaults.", error);
        // Fallback logic for corrupted data
        const defaultUsers: User[] = [
            { id: '1', name: 'Admin', phone: 'admin', passwordHash: 'admin', assignedBial: null }
        ];
        for (let i = 1; i <= 13; i++) {
            const bialName = `Upa Bial ${i}`;
            defaultUsers.push({
                id: `bial-${i}`,
                name: `${bialName} Manager`,
                phone: `bial${i}`,
                passwordHash: `bial${i}`,
                assignedBial: bialName
            });
        }
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(defaultUsers));
        return defaultUsers;
    }
};

const saveUsers = (users: User[]) => {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
};

export const login = async (phone: string, password: string): Promise<{ token: string }> => {
    await simulateDelay();
    const users = getUsers();
    const user = users.find(u => u.phone === phone && u.passwordHash === password);

    if (user) {
        const token = `mock-token-${user.id}-${Date.now()}`;
        
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem('assignedBial', JSON.stringify(user.assignedBial));
        return { token };
    } else {
        throw new Error("Invalid phone number or password.");
    }
};

export const register = async (name: string, phone: string, password: string): Promise<User> => {
    await simulateDelay();
    const users = getUsers();
    
    if (users.some(u => u.phone === phone.trim())) {
        throw new Error("A user with this phone number already exists.");
    }
    
    const newUser: User = {
        id: new Date().getTime().toString(),
        name: name.trim(),
        phone: phone.trim(),
        passwordHash: password.trim(), // Storing plaintext for demo purposes
        assignedBial: null, // New users are not assigned to a bial by default
    };

    users.push(newUser);
    saveUsers(users);

    return newUser;
};

export const requestPasswordReset = async (phone: string): Promise<string | null> => {
    await simulateDelay();
    const users = getUsers();
    const user = users.find(u => u.phone === phone);
    
    // In a real app, you would send a reset link, not return the password.
    // This is purely for demonstration.
    return user ? user.passwordHash : null;
};

export const checkAuth = (): boolean => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
        return false;
    }

    try {
        // The token format is 'mock-token-USER_ID-TIMESTAMP'
        const parts = token.split('-');
        if (parts.length < 3 || parts[0] !== 'mock' || parts[1] !== 'token') {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            return false;
        }
        // Reconstruct the user ID, which might contain hyphens (e.g., 'bial-1')
        const userId = parts.slice(2, parts.length - 1).join('-');
        
        const users = getUsers();
        // The check is now just to see if a user with this ID exists.
        // This allows multiple device logins, as we are not invalidating old tokens.
        const userExists = users.some(u => u.id === userId);

        if (userExists) {
            return true;
        }

        // If user doesn't exist (e.g., deleted), the token is invalid.
        localStorage.removeItem(AUTH_TOKEN_KEY);
        return false;
    } catch (e) {
        // Handle potential error if token format is unexpected
        localStorage.removeItem(AUTH_TOKEN_KEY);
        return false;
    }
};

export const getAssignedBial = (): string | null => {
    try {
        const bial = localStorage.getItem('assignedBial');
        // Check if bial is not undefined or null before parsing
        return bial ? JSON.parse(bial) : null;
    } catch (e) {
        // If parsing fails (e.g., old format), clear it for safety
        localStorage.removeItem('assignedBial');
        return null;
    }
};


export const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('assignedBial');
};