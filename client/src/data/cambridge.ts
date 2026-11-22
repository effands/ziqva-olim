// Mode Cambridge — padanan Bahasa Inggris PENUH untuk ZIQVA OLIM.
//
// Saat tipe sekolah yang dipilih adalah "cambridge", SEMUA soal (teks,
// pilihan, stimulus, pembahasan), modul "i", dan suara bacaan (TTS)
// berbahasa Inggris untuk semua mata pelajaran & jenjang — termasuk
// TK/PAUD. File ini memuat:
//   1) GENERATORS_EN — varian Bahasa Inggris dari generator prosedural
//      (angka & kunci jawaban tetap DIHITUNG kode, level & kerandoman
//      sama seperti versi Bahasa Indonesia).
//   2) BANK_EN — padanan Bahasa Inggris dari bank soal inti tertulis
//      (soal yang sama dengan BANK, diterjemahkan).
//   3) MODULE_EN — padanan Bahasa Inggris modul Perpustakaan ("i").
//   4) MATERIALS_EN — padanan Bahasa Inggris Bahan Belajar untuk mapel
//      yang hanya punya modul turunan (fallback) di Perpustakaan.
// Tipe sekolah lain tidak memakai file ini sama sekali.

import type { JenjangId, Question } from "./questions";
import {
  classifyGenL, factGenL, mkq, pairGenL, pick, ri, sample, shuffle,
  type Fact, type LGen,
} from "./generators";
import type { LibraryModule } from "./library";
import type { Material } from "./materials";

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;
const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};
const enFmt = (n: number) => n.toLocaleString("en-US");

function mkNumEn(q: string, correct: number, distractors: number[], explain: string, emoji?: string, four = true): Question | null {
  return mkq(q, enFmt(correct), distractors.map((d) => enFmt(d)), explain, emoji, four);
}

/* ================= BANK PASANGAN & FAKTA (Bahasa Inggris) ================= */
export const PROVINSI_EN: readonly (readonly [string, string])[] = [
  ["Aceh", "Banda Aceh"], ["North Sumatra", "Medan"], ["West Sumatra", "Padang"],
  ["Riau", "Pekanbaru"], ["Jambi", "Jambi"], ["South Sumatra", "Palembang"],
  ["Bengkulu", "Bengkulu"], ["Lampung", "Bandar Lampung"], ["Banten", "Serang"],
  ["West Java", "Bandung"], ["Central Java", "Semarang"], ["DI Yogyakarta", "Yogyakarta"],
  ["East Java", "Surabaya"], ["Bali", "Denpasar"], ["West Kalimantan", "Pontianak"],
  ["East Kalimantan", "Samarinda"], ["South Kalimantan", "Banjarbaru"],
  ["South Sulawesi", "Makassar"], ["North Sulawesi", "Manado"], ["Papua", "Jayapura"],
  ["Maluku", "Ambon"], ["West Nusa Tenggara", "Mataram"], ["East Nusa Tenggara", "Kupang"],
  ["Gorontalo", "Gorontalo"], ["West Sulawesi", "Mamuju"], ["Riau Islands", "Tanjung Pinang"],
];
export const PAHLAWAN_EN: readonly (readonly [string, string])[] = [
  ["Cut Nyak Dien", "Aceh"], ["Pattimura (Thomas Matulessy)", "Maluku (Ambon)"], ["Prince Diponegoro", "Central Java (Yogyakarta)"],
  ["Tuanku Imam Bonjol", "West Sumatra"], ["Sultan Hasanuddin", "South Sulawesi"], ["R.A. Kartini", "Central Java (Jepara)"],
  ["General Sudirman", "Central Java (Purbalingga)"], ["Bung Tomo (Sutomo)", "East Java (Surabaya)"],
  ["I Gusti Ngurah Rai", "Bali"], ["Martha Christina Tiahahu", "Maluku (Nusalaut)"],
];
export const EVENT_YEAR_EN: readonly (readonly [string, string])[] = [
  ["The Rengasdengklok Incident", "16 August 1945"], ["The Proclamation of Indonesian Independence", "17 August 1945"],
  ["The Youth Pledge (Sumpah Pemuda)", "28 October 1928"], ["National Awakening Day (founding of Budi Utomo)", "20 May 1908"],
  ["The PPKI session ratifying the 1945 Constitution", "18 August 1945"], ["The Diponegoro War", "1825–1830"],
  ["The founding of the VOC", "1602"], ["The start of the Cultivation System (Cultuurstelsel)", "1830"],
  ["The start of the Japanese occupation of Indonesia", "1942"], ["The Round Table Conference", "1949"],
  ["The Presidential Decree returning to the 1945 Constitution", "5 July 1959"], ["The start of Reformasi (Soeharto steps down)", "21 May 1998"],
];
export const KERAJAAN_EN: readonly (readonly [string, string])[] = [
  ["Sriwijaya", "Palembang — the greatest maritime kingdom of the archipelago"],
  ["Majapahit", "Trowulan, East Java — united by Gajah Mada"],
  ["Kutai", "Muara Kaman, East Kalimantan — the Yupa inscriptions"],
  ["Tarumanagara", "Bogor, West Java — the Ciaruteun inscription"],
  ["Ancient Mataram", "Central Java — built Borobudur Temple"],
  ["Demak", "Central Java coast — the first Islamic kingdom in Java"],
  ["Singasari", "Malang, East Java — founded by Ken Arok"],
  ["Kediri", "Kediri, East Java — famous for the prophecies of Jayabaya"],
  ["Pajajaran", "Pakuan Bogor — led by Prabu Siliwangi"],
  ["Aceh Darussalam", "Banda Aceh — golden age under Sultan Iskandar Muda"],
  ["Banten", "Banten — led by Sultan Ageng Tirtayasa"],
  ["Gowa", "Makassar — led by Sultan Hasanuddin"],
];
export const PERISTIWA_ID_EN: readonly (readonly [string, string])[] = [
  ["The Proclamation of Indonesian Independence", "17 August 1945"],
  ["The Youth Pledge (Sumpah Pemuda)", "28 October 1928"],
  ["The founding of Budi Utomo (National Awakening)", "20 May 1908"],
  ["The founding of the VOC", "The year 1602"],
  ["Japan begins occupying Indonesia", "The year 1942"],
  ["The Round Table Conference", "The year 1949"],
  ["Indonesia's first general election", "The year 1955"],
  ["The Presidential Decree returning to the 1945 Constitution", "5 July 1959"],
  ["Supersemar", "11 March 1966"],
  ["Soeharto resigns as president (start of Reformasi)", "21 May 1998"],
];
export const PERISTIWA_DUNIA_EN: readonly (readonly [string, string])[] = [
  ["The Independence of the United States", "4 July 1776"],
  ["The French Revolution", "The year 1789"],
  ["The start of World War I", "The year 1914"],
  ["The start of World War II", "The year 1939"],
  ["The Fall of Constantinople to the Ottoman Turks", "The year 1453"],
  ["The first human in space (Yuri Gagarin)", "The year 1961"],
  ["The first humans land on the Moon", "The year 1969"],
  ["The Fall of the Berlin Wall", "The year 1989"],
  ["The dissolution of the Soviet Union (end of the Cold War)", "The year 1991"],
];
export const SMP_IPS_PAIRS_EN: readonly (readonly [string, string])[] = [
  ["Kutai", "The oldest Hindu kingdom in Indonesia (proven by the Yupa inscriptions)"], ["Sriwijaya", "A Buddhist maritime kingdom centred in Palembang"],
  ["Majapahit", "A great kingdom centred in East Java, whose chief minister was Gajah Mada"], ["Tarumanagara", "A Hindu kingdom in West Java, whose king was Purnawarman"],
  ["Demak", "The first Islamic sultanate in Java"], ["Ancient Mataram", "The kingdom that built Borobudur and Prambanan temples"],
];
export const UNSUR_EN: readonly (readonly [string, string])[] = [
  ["Hydrogen", "H"], ["Helium", "He"], ["Lithium", "Li"], ["Carbon", "C"], ["Nitrogen", "N"],
  ["Oxygen", "O"], ["Sodium", "Na"], ["Magnesium", "Mg"], ["Aluminium", "Al"], ["Silicon", "Si"],
  ["Phosphorus", "P"], ["Sulfur", "S"], ["Chlorine", "Cl"], ["Potassium", "K"], ["Calcium", "Ca"],
  ["Iron", "Fe"], ["Copper", "Cu"], ["Zinc", "Zn"], ["Silver", "Ag"], ["Gold", "Au"],
  ["Mercury", "Hg"], ["Lead", "Pb"], ["Tin", "Sn"], ["Platinum", "Pt"], ["Nickel", "Ni"],
];
export const ENZIM_EN: readonly (readonly [string, string])[] = [
  ["Amylase (ptyalin)", "Converts starch into sugar"], ["Pepsin", "Converts protein into peptones"],
  ["Lipase", "Converts fat into fatty acids and glycerol"], ["Trypsin", "Converts protein / peptones into amino acids"],
  ["Lactase", "Converts lactose (milk sugar) into glucose and galactose"], ["Maltase", "Converts maltose into glucose"],
  ["Sucrase", "Converts sucrose into glucose and fructose"], ["Renin (in a baby's stomach)", "Curdles milk casein"],
];
export const ORGANEL_EN: readonly (readonly [string, string])[] = [
  ["Mitochondria", "The site of cell respiration, producing energy (ATP)"], ["Ribosome", "The site of protein synthesis"],
  ["Nucleus", "Controls all cell activities & carries genetic material"], ["Vacuole", "Stores food reserves & waste substances"],
  ["Chloroplast", "The site of photosynthesis in plant cells"], ["Cell membrane", "Regulates substances entering and leaving & protects the cell"],
  ["Cytoplasm", "The fluid where organelles sit & cell chemical reactions happen"], ["Golgi body", "Packages & distributes protein products"],
  ["Lysosome", "Digests foreign substances & damaged organelles"], ["Cell wall", "Gives shape & strength to plant cells"],
];
export const OSI_EN: readonly (readonly [string, string])[] = [
  ["Physical (Layer 1)", "Sends raw bits over physical media (cables, signals)"], ["Data Link (Layer 2)", "Frame delivery between devices on one network & error detection"],
  ["Network (Layer 3)", "IP addressing and routing between networks"], ["Transport (Layer 4)", "End-to-end data delivery (TCP/UDP), segmentation & reliability"],
  ["Session (Layer 5)", "Opens, manages, and closes communication sessions"], ["Presentation (Layer 6)", "Encryption, compression, and data formats"],
  ["Application (Layer 7)", "Network service interface for applications (HTTP, FTP, SMTP)"],
];
export const ATTACK_EN: readonly (readonly [string, string])[] = [
  ["Phishing", "Fraud that steals sensitive data through fake messages/sites"], ["DDoS", "Flooding a server with fake traffic until it collapses"],
  ["Ransomware", "Malware that encrypts data and demands a ransom"], ["Sniffing", "Eavesdropping on data traffic in a network"],
  ["SQL Injection", "Inserting malicious SQL commands through application input"], ["Spoofing", "Impersonating a trusted party to deceive a system/victim"],
];
export const CAM_SCI_PAIRS_EN: readonly (readonly [string, string])[] = [
  ["Leaf", "Makes food for the plant by photosynthesis"], ["Root", "Absorbs water and minerals from the soil"],
  ["Stem", "Supports the plant and transports water and food"], ["Flower", "The reproductive part of the plant"],
  ["Gravity", "The force that pulls objects towards the Earth"], ["Friction", "The force that opposes motion between surfaces"],
  ["Newton (N)", "The unit of force"], ["Joule (J)", "The unit of energy"], ["Watt (W)", "The unit of power"],
];
const ROMAN_PAIRS_EN: readonly (readonly [string, string])[] = [
  ["1", "I"], ["2", "II"], ["3", "III"], ["4", "IV"], ["5", "V"], ["6", "VI"], ["7", "VII"], ["8", "VIII"],
  ["9", "IX"], ["10", "X"], ["11", "XI"], ["12", "XII"], ["14", "XIV"], ["15", "XV"], ["19", "XIX"],
  ["20", "XX"], ["24", "XXIV"], ["30", "XXX"], ["40", "XL"], ["50", "L"], ["90", "XC"], ["100", "C"],
];
export const EN_VOCAB_EN: readonly (readonly [string, string])[] = [
  ["book", "a thing we read, with pages of words"],
  ["pencil", "a tool for writing and drawing"],
  ["teacher", "a person who teaches at school"],
  ["student", "a person who learns at school"],
  ["school", "a place where children learn"],
  ["cat", "a small pet animal that says meow"],
  ["dog", "a pet animal that says woof"],
  ["bird", "an animal with wings that can fly"],
  ["fish", "an animal that swims in water"],
  ["horse", "a big animal people can ride"],
  ["apple", "a round red or green fruit"],
  ["banana", "a long yellow fruit"],
  ["rice", "white grains we cook and eat"],
  ["water", "the clear liquid we drink"],
  ["milk", "a white drink from a cow"],
  ["sun", "the star shining in the daytime"],
  ["moon", "the bright object in the night sky"],
  ["star", "a tiny shining light in the night sky"],
  ["rain", "water falling from clouds"],
  ["tree", "a tall plant with a trunk and leaves"],
  ["house", "a building where people live"],
  ["door", "the part of a room we open to enter"],
  ["window", "an opening in a wall for light and air"],
  ["chair", "something we sit on"],
  ["table", "furniture with a flat top for placing things"],
  ["happy", "feeling glad and joyful"],
  ["sad", "feeling unhappy"],
  ["big", "large in size"],
  ["small", "little in size"],
  ["fast", "moving quickly"],
  ["run", "to move quickly on foot"],
  ["eat", "to put food into the mouth"],
  ["drink", "to take in liquid"],
  ["read", "to look at words and understand them"],
  ["write", "to make letters and words"],
  ["morning", "the early part of the day"],
  ["night", "the dark part of the day"],
  ["friend", "a person we like and play with"],
  ["family", "parents and children living together"],
  ["market", "a place where people buy and sell"],
  ["mountain", "very high land"],
  ["river", "water flowing in a long line"],
  ["sea", "a large body of salty water"],
  ["garden", "land for growing plants and flowers"],
  ["library", "a place full of books to read"],
];
export const EN_OPPOSITES_EN: readonly (readonly [string, string])[] = [
  ["big", "small"], ["hot", "cold"], ["fast", "slow"], ["happy", "sad"], ["brave", "afraid"],
  ["strong", "weak"], ["ancient", "modern"], ["bright", "dark"], ["rich", "poor"], ["easy", "difficult"],
  ["near", "far"], ["early", "late"], ["safe", "dangerous"], ["polite", "rude"],
];
export const EN_PAST_EN: readonly (readonly [string, string])[] = [
  ["go", "went"], ["eat", "ate"], ["drink", "drank"], ["read", "read"], ["write", "wrote"],
  ["see", "saw"], ["buy", "bought"], ["swim", "swam"], ["sleep", "slept"], ["run", "ran"],
  ["sing", "sang"], ["take", "took"], ["give", "gave"], ["come", "came"], ["make", "made"],
];
export const EN_PLURALS_EN: readonly (readonly [string, string])[] = [
  ["child", "children"], ["man", "men"], ["woman", "women"], ["tooth", "teeth"], ["foot", "feet"],
  ["mouse", "mice"], ["leaf", "leaves"], ["knife", "knives"], ["box", "boxes"], ["watch", "watches"],
  ["baby", "babies"], ["city", "cities"], ["sheep", "sheep"], ["fish", "fish"],
];

/* ================= FAKTA (Bahasa Inggris) ================= */
const TK_SAINS_FACTS_EN: Fact[] = [
  ["Which animal can fly?", "Butterfly", ["Fish", "Cat"], "A butterfly has wings and can fly."],
  ["We see with our …", "Eyes", ["Ears", "Nose"], "The eyes are the sense of sight."],
  ["We hear sounds with our …", "Ears", ["Eyes", "Skin"], "The ears are the sense of hearing."],
  ["What do plants need to grow well?", "Water and sunlight", ["Toys", "Shoes"], "Plants need water and sunlight to grow."],
  ["The sound a cow makes is …", "Moo", ["Meow", "Woof woof"], "A cow says “moo”."],
  ["The sound a cat makes is …", "Meow", ["Moo", "Cock-a-doodle-doo"], "A cat says “meow”."],
  ["What can we see in the sky at night?", "The Moon and stars", ["The Sun", "A rainbow"], "At night we see the Moon and the stars."],
  ["Healthy leaves are usually coloured …", "Green", ["Purple", "Black"], "Leaves are green because they contain chlorophyll."],
  ["Which animal loves eating carrots?", "Rabbit", ["Lion", "Eagle"], "Rabbits love carrots and vegetables."],
  ["We smell with our …", "Nose", ["Eyes", "Hands"], "The nose is the sense of smell."],
];
const TK_SAINS_PAIRS_EN: readonly (readonly [string, string])[] = [
  ["Fish", "Water (sea / river / pond)"], ["Bird", "The sky and trees"], ["Cow", "Grassland / farm"],
  ["Frog", "Ponds and land"], ["Bee", "Around flowers and hives"], ["Monkey", "Trees in the forest"],
  ["Rabbit", "Burrows and gardens"], ["Butterfly", "Flower gardens"],
];
const TK_SHAPE_FACTS_EN: Fact[] = [
  ["A triangle has … sides", "3 sides", ["2 sides", "4 sides"], "A triangle has 3 sides and 3 corners."],
  ["A square has … sides of equal length", "4 sides", ["3 sides", "5 sides"], "A square has 4 equal sides."],
  ["A circle has … corners", "0 corners", ["1 corner", "4 corners"], "A circle is curved and has no corners."],
  ["A pentagon has … sides", "5 sides", ["4 sides", "6 sides"], "A pentagon has 5 sides."],
  ["A hexagon has … sides", "6 sides", ["5 sides", "8 sides"], "A hexagon has 6 sides."],
  ["A bicycle wheel is shaped like a …", "Circle", ["Triangle", "Square"], "Wheels are circles so they can roll."],
  ["A “STOP” traffic sign is usually shaped like a …", "Octagon", ["Triangle", "Circle"], "STOP signs are octagons (8 sides)."],
];
const TK_SEJ_PAIRS_EN: readonly (readonly [string, string])[] = [
  ["Ir. Soekarno", "The first President of Indonesia"],
  ["Moh. Hatta", "The first Vice President of Indonesia"],
  ["Mrs Fatmawati", "Sewed the heirloom flag (Bendera Pusaka)"],
  ["Garuda Pancasila", "The national emblem of Indonesia"],
  ["Indonesia Raya", "The national anthem of Indonesia"],
  ["Red and White (Merah Putih)", "The national flag of Indonesia"],
  ["Monas", "The tall monument in Jakarta"],
  ["17 August", "Indonesia's Independence Day"],
];
const TK_SEJ_FACTS_EN: Fact[] = [
  ["The colours of our country's flag, Indonesia, are …", "Red and white", ["Blue and yellow", "Green and black"], "The Indonesian flag: red on top, white below. Red means brave, white means pure."],
  ["Our national anthem is …", "Indonesia Raya", ["Garuda Pancasila", "Maju Tak Gentar"], "Indonesia Raya was composed by Wage Rudolf Supratman."],
  ["Indonesia's Independence Day is celebrated every …", "17 August", ["1 June", "20 May"], "Indonesia became independent on 17 August 1945."],
  ["The national emblem of Indonesia is …", "Garuda Pancasila", ["Bull", "Banyan tree"], "Garuda Pancasila is our national emblem."],
  ["The first President of Indonesia was …", "Ir. Soekarno", ["Moh. Hatta", "Soeharto"], "Ir. Soekarno was the first president; Moh. Hatta was the first vice president."],
  ["A hero (pahlawan) is someone who is …", "Brave and kind, defending the country", ["Fond of fighting", "The richest person"], "Heroes fight for their country and its people."],
  ["The capital city of Indonesia is …", "Jakarta", ["Bandung", "Surabaya"], "Jakarta is the capital city (the government is gradually moving to Nusantara/IKN)."],
];
const SEJ_SD_FACTS_EN: Fact[] = [
  ["The text of the Proclamation of Independence was read aloud by …", "Ir. Soekarno", ["Moh. Hatta", "Sutan Sjahrir"], "Soekarno read the proclamation accompanied by Moh. Hatta, on 17 August 1945 in Jakarta."],
  ["The Red and White flag raised at the proclamation was sewn by …", "Mrs Fatmawati", ["Mrs Kartini", "Cut Nyak Dien"], "Fatmawati, Soekarno's wife, sewed the Heirloom Flag (Bendera Pusaka)."],
  ["The Dutch trading company that colonised Indonesia was the …", "VOC", ["UN", "KNIL", "BPUPKI"], "The VOC (1602) was the Dutch trading company that monopolised spices."],
  ["The greatest war against the Dutch in Java was led by …", "Prince Diponegoro", ["Pattimura", "Imam Bonjol"], "The Diponegoro War / Java War lasted from 1825 to 1830."],
  ["The forced cultivation system (cultuurstelsel) made people suffer because they were …", "Forced to grow export crops for the Dutch", ["Forbidden to go to school", "Forced to move islands", "Forbidden to trade forever"], "Forced cultivation (1830) forced people to grow coffee, sugar cane, etc. for the Dutch."],
  ["The Youth Pledge promised one homeland, one nation, and one language, namely …", "Indonesia", ["Malay", "Javanese"], "The Youth Pledge of 28 October 1928: one homeland, one nation, and one language — Indonesia."],
  ["The song Indonesia Raya was first performed at the event of …", "The Youth Pledge 1928", ["The Proclamation 1945", "The Women's Congress", "The 1955 Election"], "W.R. Supratman played Indonesia Raya on the violin at the Second Youth Congress, 1928."],
  ["The greatest maritime kingdom that controlled the Strait of Malacca was …", "Sriwijaya", ["Majapahit", "Kutai"], "Sriwijaya was centred in Palembang and was strong at sea and in trade."],
  ["The famous Sumpah Palapa oath was spoken by …", "Gajah Mada", ["Hayam Wuruk", "Ken Arok"], "Gajah Mada, the chief minister of Majapahit, spoke the Sumpah Palapa oath."],
  ["Heroes' Day on 10 November commemorates a great battle in …", "Surabaya", ["Jakarta", "Medan"], "The Battle of Surabaya on 10 November 1945 against the Allied forces."],
];
const SEJ_SMP_FACTS_EN: Fact[] = [
  ["The first European nation to arrive and conquer Malacca (1511) was …", "Portugal", ["The Netherlands", "England"], "The Portuguese, led by Alfonso de Albuquerque, seized Malacca in 1511."],
  ["The first Dutch expedition arrived in Banten (1596) led by …", "Cornelis de Houtman", ["Jan Pieterszoon Coen", "Daendels"], "De Houtman arrived in 1596; the VOC was founded in 1602."],
  ["The Governor-General who built the Anyer–Panarukan highway was …", "Herman Willem Daendels", ["Raffles", "Van den Bosch"], "Daendels (1808–1811) built the Great Post Road using forced labour."],
  ["The British Governor-General who wrote the book History of Java was …", "Thomas Stamford Raffles", ["Daendels", "Janssens"], "Raffles governed from 1811 to 1816 and wrote History of Java."],
  ["The forced cultivation system (1830) was introduced by Governor-General …", "Johannes van den Bosch", ["Daendels", "Raffles"], "Van den Bosch started the cultuurstelsel in 1830."],
  ["The first national movement organisation, Budi Utomo, was founded on the idea of …", "dr. Wahidin Sudirohusodo", ["Ir. Soekarno", "HOS Tjokroaminoto"], "Budi Utomo was founded on 20 May 1908; its chairman was dr. Sutomo."],
  ["The figure nicknamed the 'Uncrowned King of Java' who led Sarekat Islam was …", "HOS Tjokroaminoto", ["Ki Hajar Dewantara", "Douwes Dekker"], "Tjokroaminoto led Sarekat Islam; Soekarno once lodged at his house."],
  ["Japan began occupying Indonesia after the Dutch surrendered at … (1942)", "Kalijati, Subang", ["Jakarta", "Surabaya"], "The Dutch surrendered unconditionally to Japan at Kalijati on 8 March 1942."],
  ["The body formed by Japan to prepare Indonesian independence was …", "BPUPKI", ["PPKI only", "KNIP", "DPR"], "BPUPKI (1945) formulated the state foundation; PPKI ratified the 1945 Constitution on 18 August 1945."],
  ["The event of burning one's own city so the Allies could not seize it (1946) is known as …", "Bandung Lautan Api", ["Puputan Margarana", "The General Offensive"], "Bandung Lautan Api: 24 March 1946, residents burned southern Bandung."],
  ["The Puputan Margarana war in Bali (1946) was led by …", "I Gusti Ngurah Rai", ["Sultan Hasanuddin", "Untung Surapati"], "Ngurah Rai and his troops fell in the Puputan Margarana."],
  ["The General Offensive of 1 March 1949 took place in the city of …", "Yogyakarta", ["Jakarta", "Semarang"], "The General Offensive held Yogyakarta for 6 hours, proving the Republic of Indonesia still existed."],
  ["The result of the Round Table Conference (1949) was …", "The Netherlands recognised Indonesian sovereignty", ["Indonesia became a Dutch province", "The war continued", "The capital moved"], "The RTC in The Hague: the Netherlands recognised the sovereignty of the RIS on 27 December 1949."],
];
const SEJ_SMA_FACTS_EN: Fact[] = [
  ["The government system during Guided Democracy (1959–1965) was centred on the leadership of …", "President Soekarno", ["Parliament", "The military entirely", "A king"], "The Decree of 5 July 1959 opened the Guided Democracy era."],
  ["The 30 September 1965 event (G30S) killed …", "Six generals and one Indonesian Army officer", ["President Soekarno", "The entire cabinet", "No victims"], "Seven Indonesian Army officers were victims; the bodies were found at Lubang Buaya. This event is factual and became a turning point in Indonesian history."],
  ["The order letter that became the basis for the transfer of power from Soekarno to Soeharto (11 March 1966) is called …", "Supersemar", ["The Decree", "The Proclamation", "Tritura"], "Supersemar = Surat Perintah Sebelas Maret (Order of 11 March) 1966."],
  ["The five-year development programme during the New Order was called …", "Repelita", ["Renstra", "Pembangunan Semesta", "Pelita Bangsa"], "Repelita = Rencana Pembangunan Lima Tahun (Five-Year Development Plan), started in 1969."],
  ["Reformasi 1998 was marked by President Soeharto stepping down and being replaced by …", "B.J. Habibie", ["Abdurrahman Wahid", "Megawati Soekarnoputri"], "Soeharto stepped down on 21 May 1998; Vice President B.J. Habibie was sworn in as president."],
  ["The first general election of the Reformasi era was held in the year …", "1999", ["1997", "2004", "2009"], "The election of 7 June 1999 was the first democratic election after the New Order."],
  ["World War I (1914–1918) was triggered by the assassination of the Austrian crown prince, Franz Ferdinand, in the city of …", "Sarajevo", ["Berlin", "Vienna"], "The assassination in Sarajevo on 28 June 1914 triggered WWI."],
  ["World War II in Europe began with Germany's invasion of …", "Poland", ["France", "The Netherlands"], "The invasion of 1 September 1939 started WWII."],
  ["Japan's attack on the United States naval base at Pearl Harbor happened in the year …", "1941", ["1939", "1943"], "Pearl Harbor was attacked on 7 December 1941; the US entered WWII."],
  ["The Japanese cities hit by the first and second atomic bombs (August 1945) were …", "Hiroshima and Nagasaki", ["Tokyo and Osaka", "Kyoto and Kobe"], "Hiroshima on 6 August, Nagasaki on 9 August 1945; Japan surrendered on 15 August 1945."],
  ["The Cold War was a tension without direct war between …", "The United States and the Soviet Union", ["Germany and France", "England and Japan"], "The Western Bloc (US) vs the Eastern Bloc (Soviet Union), c. 1947–1991."],
  ["The Western Bloc military alliance formed in 1949 was …", "NATO", ["The Warsaw Pact", "ASEAN", "SEATO"], "NATO 1949; the Warsaw Pact (1955) was the Eastern Bloc counterpart."],
  ["The Mesopotamian civilisation developed between two rivers, namely the …", "Tigris and Euphrates", ["Nile and Niger", "Ganges and Yamuna"], "Mesopotamia (now Iraq) between the Tigris & Euphrates — where cuneiform writing was born."],
  ["The Industrial Revolution first began in the country of … with the invention of the steam engine", "England", ["France", "Germany"], "The Industrial Revolution began in 18th-century England; the steam engine was perfected by James Watt."],
  ["The power vacuum that accelerated the 1945 Proclamation happened because …", "Japan had surrendered to the Allies", ["The Dutch returned", "BPUPKI was dissolved by the people", "Soekarno was arrested"], "Japan surrendered on 15 August 1945; the youth urged an immediate proclamation (the Rengasdengklok Incident)."],
];
const SD_SAINS_PAIRS_EN: readonly (readonly [string, string])[] = [
  ["Root", "Absorbs water and nutrients from the soil"], ["Leaf", "The site of photosynthesis / making food"],
  ["Stem", "Supports the plant & transports water and food"], ["Flower", "The reproductive part of the plant"],
  ["Heart", "Pumps blood throughout the body"], ["Lungs", "The site of exchange of oxygen and carbon dioxide"],
  ["Brain", "Controls thoughts and all body activities"], ["Stomach", "Chemically digests food"],
  ["Liver", "Neutralises toxins and produces bile"], ["Kidneys", "Filter blood and form urine"],
  ["Skin", "Protects the body & the sense of touch"], ["Bones", "Support and protect the body's organs"],
];
const SD_SAINS_CLASSIFY_EN: { item: string; cat: string }[] = [
  ...["Butterfly", "Frog", "Mosquito", "Housefly"].map((x) => ({ item: x, cat: "Complete metamorphosis" })),
  ...["Grasshopper", "Cockroach", "Dragonfly", "Cricket"].map((x) => ({ item: x, cat: "Incomplete metamorphosis" })),
  ...["Chicken", "Cat", "Fish", "Snake"].map((x) => ({ item: x, cat: "No metamorphosis" })),
];
const SD_SAINS_FACTS_EN: Fact[] = [
  ["The change of state from liquid to gas is called …", "Evaporation", ["Freezing", "Melting", "Condensation"], "Liquid → gas = evaporation."],
  ["The change of state from gas to liquid is called …", "Condensation", ["Evaporation", "Freezing", "Sublimation"], "Gas → liquid = condensation, for example morning dew."],
  ["The change of state from solid to liquid is called …", "Melting", ["Freezing", "Evaporation", "Condensation"], "Solid → liquid = melting, for example ice becoming water."],
  ["The main source of energy for life on Earth is …", "The Sun", ["The Moon", "Stars", "Fire"], "The Sun is the main energy source on Earth."],
  ["The force that makes fruit fall to the ground is …", "Gravity", ["Friction", "Magnetism", "Muscle force"], "Earth's gravity pulls objects downwards."],
  ["The planet closest to the Sun is …", "Mercury", ["Venus", "Earth", "Mars"], "Order: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune."],
  ["The planet we live on is …", "Earth", ["Mars", "Venus", "Jupiter"], "Earth is the third planet from the Sun and our home."],
  ["The largest planet in the solar system is …", "Jupiter", ["Saturn", "Neptune", "Uranus"], "Jupiter is the largest giant planet."],
  ["The celestial body that emits its own light is a …", "Star", ["Planet", "Moon", "Comet"], "Stars emit their own light; planets reflect starlight."],
  ["The instrument used to measure temperature is a …", "Thermometer", ["Barometer", "Ammeter", "Dynamometer"], "A thermometer measures temperature; a barometer air pressure; an ammeter electric current."],
];
const SMP_SAINS_FACTS_EN: Fact[] = [
  ["The cell organelle that is the site of energy-producing respiration is the …", "Mitochondria", ["Ribosome", "Nucleus", "Vacuole"], "Mitochondria = the “powerhouse of the cell”, producing ATP."],
  ["The general equation of photosynthesis is …", "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", ["C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O", "CO₂ + O₂ → C₆H₁₂O₆", "6O₂ + 6H₂O → C₆H₁₂O₆ + CO₂"], "Photosynthesis: CO₂ + water —(light & chlorophyll)→ glucose + oxygen."],
  ["The pH of an acidic solution is …", "pH < 7", ["pH = 7", "pH > 7", "pH = 14"], "Acid: pH<7, neutral: 7, base: pH>7."],
  ["Heat transfer without any medium is called …", "Radiation", ["Conduction", "Convection", "Insulation"], "Radiation: the Sun's heat reaches Earth without a medium."],
  ["The SI unit of electric current is the …", "Ampere", ["Volt", "Ohm", "Watt"], "Current = Ampere; voltage = Volt; resistance = Ohm; power = Watt."],
  ["The SI unit of force is the …", "Newton", ["Joule", "Pascal", "Watt"], "Force is measured in Newtons (N); energy in Joules; pressure in Pascals; power in Watts."],
  ["The green pigment in leaves that captures light for photosynthesis is …", "Chlorophyll", ["Haemoglobin", "Melanin", "Carotene"], "Chlorophyll gives the green colour and captures light energy."],
  ["A mixture that is uniform throughout (its parts cannot be distinguished) is called a … mixture", "Homogeneous", ["Heterogeneous", "Suspension", "Coarse colloid"], "A homogeneous mixture is evenly mixed, for example sugar water."],
];
const TRIG_FACTS_EN: Fact[] = [
  ["The value of sin 30° is …", "1/2", ["√3/2", "1", "0"], "Special angles: sin 30° = 1/2, cos 30° = √3/2."],
  ["The value of cos 60° is …", "1/2", ["√3/2", "√2/2", "0"], "cos 60° = 1/2 (the pair of sin 30°)."],
  ["The value of tan 45° is …", "1", ["1/2", "√3", "1/√3"], "tan 45° = sin/cos = (√2/2)/(√2/2) = 1."],
  ["The value of sin 90° is …", "1", ["0", "1/2", "√3/2"], "Sine reaches its maximum of 1 at 90°."],
  ["The value of cos 0° is …", "1", ["0", "1/2", "-1"], "cos 0° = 1; sin 0° = 0."],
  ["The value of sin 60° is …", "√3/2", ["1/2", "√2/2", "1"], "sin 60° = √3/2 ≈ 0.866."],
  ["The value of tan 30° is …", "1/√3", ["1", "√3", "1/2"], "tan 30° = (1/2)/(√3/2) = 1/√3."],
  ["The value of sin²x + cos²x for every x is …", "1", ["0", "2", "Depends on x"], "The Pythagorean identity: sin²x + cos²x = 1."],
];
const TK_KOMPUTER_PAIRS_EN: readonly (readonly [string, string])[] = [
  ["Mouse", "Moves the arrow (cursor) on the screen"],
  ["Keyboard", "Types letters and numbers"],
  ["Monitor / screen", "Displays pictures and writing"],
  ["Speaker", "Plays sounds and music"],
  ["Printer", "Prints pictures and writing onto paper"],
  ["Tablet", "A touch screen for learning and playing"],
  ["Camera", "Takes photos and videos"],
  ["Charger", "Charges the device's battery"],
];
const TK_KOMPUTER_FACTS_EN: Fact[] = [
  ["Before playing with a phone or tablet, we must …", "Ask our parents for permission", ["Take it secretly right away", "Play until midnight"], "Always ask your parents for permission before using a device."],
  ["Playing with devices for too long can make our …", "Eyes tired and body sore", ["Body stronger", "Grow taller quickly"], "Rest your eyes and move around after playing with devices."],
  ["If a stranger invites us to chat through a game or the internet, we must …", "Tell our parents", ["Reply to the invitation", "Give our home address"], "Never chat with strangers on the internet; tell your parents."],
  ["After finishing playing with a device, we should …", "Rest and play outside", ["Play again right away", "Not sleep"], "Balance screen time with playing and moving."],
  ["The part of the computer full of letters for typing is the …", "Keyboard", ["Mouse", "Speaker"], "The keyboard is used to type letters and numbers."],
  ["To hear sounds from the computer we use a …", "Speaker / headphones", ["Printer", "Mouse"], "A speaker produces sound."],
];
const INF_CLASSIFY_EN: { item: string; cat: string }[] = [
  ...["Keyboard", "Mouse", "Scanner", "Microphone", "Webcam", "Touch screen"].map((x) => ({ item: x, cat: "Input device" })),
  ...["Monitor", "Printer", "Speaker", "Projector", "Headphones"].map((x) => ({ item: x, cat: "Output device" })),
  ...["CPU / Processor", "RAM", "Motherboard"].map((x) => ({ item: x, cat: "Processing device" })),
  ...["Hard disk", "SSD", "Flash drive", "Memory card"].map((x) => ({ item: x, cat: "Storage device" })),
  ...["Microsoft Word", "Paint", "Google Chrome", "Calculator (app)", "Educational game"].map((x) => ({ item: x, cat: "Software" })),
];
const IO_CLASSIFY_EN: { item: string; cat: string }[] = [
  ...["Keyboard", "Mouse", "Scanner", "Microphone", "Webcam", "Joystick", "Touch screen"].map((x) => ({ item: x, cat: "Input device" })),
  ...["Monitor", "Printer", "Speaker", "Projector", "Headphones"].map((x) => ({ item: x, cat: "Output device" })),
  ...["Flash drive", "Hard disk", "SSD", "Memory card", "CD / DVD"].map((x) => ({ item: x, cat: "Storage device" })),
];
const SD_TIK_PAIRS_EN: readonly (readonly [string, string])[] = [
  ["CPU (processor)", "The brain of the computer that processes all commands"],
  ["RAM", "Temporary memory while the computer works"],
  ["Hard disk / SSD", "Stores data permanently"],
  ["Modem", "Connects the computer to the internet"],
  ["Webcam", "A camera for video calls"],
  ["Scanner", "Scans documents or photos into files"],
  ["Projector", "Displays images onto a big screen / wall"],
  ["Flash drive", "A small storage tool that is easy to carry"],
  ["Microphone", "Records our voice"],
  ["Headphones", "For listening to sound without disturbing others"],
  ["Touchpad", "A mouse replacement on a laptop"],
  ["Battery", "The power source of laptops and devices"],
  ["Monitor", "Displays pictures and writing from the computer"],
  ["Keyboard", "Types letters, numbers, and symbols"],
];
const SD_TIK_FACTS_EN: Fact[] = [
  ["A Microsoft Word text document usually has the file extension …", ".docx", [".jpg", ".mp3", ".mp4"], "The extension shows the file type: .docx document, .jpg image, .mp3 song, .mp4 video."],
  ["The application used for typing letters and stories is called a … application", "Word processor", ["Image editor", "Music player", "Calculator"], "A word processor (e.g. Microsoft Word) is for typing documents."],
  ["A good password is one that is …", "Long and hard for others to guess", ["The same as your birth date", "Just 123456", "Your own name"], "A strong password: long, a mix of letters-numbers-symbols, and secret."],
  ["If we find an inappropriate picture or text on the internet, we must …", "Close it and tell a teacher / parent", ["Share it with friends", "Save it secretly", "Click all its links"], "Healthy internet: close inappropriate content and report it to an adult."],
  ["The brain of the computer that processes all commands is the …", "CPU (processor)", ["Monitor", "Cable", "Fan"], "CPU = Central Processing Unit, the centre of processing."],
  ["The place for grouping files on a computer is called a …", "Folder", ["Icon", "Paper", "Screen"], "Folders group files so they are neat and easy to find."],
  ["Typing with ten fingers without looking at the keyboard is called …", "Touch typing", ["One-finger typing", "Fast careless typing", "Copying"], "Touch typing makes typing fast and accurate."],
  ["“Perangkat lunak” in English is called …", "Software", ["Hardware", "Brainware", "Firmware"], "Software = perangkat lunak; hardware = perangkat keras."],
  ["The giant network connecting computers all over the world is the …", "Internet", ["School intranet", "LAN cable", "Bluetooth"], "The internet connects networks all over the world."],
];
const SD_TIK_FACTS2_EN: Fact[] = [
  ["To search for information on the internet we use a …", "Search engine", ["Calculator", "Music player", "Camera"], "Search engines like Google help find information."],
  ["An electronic letter sent over the internet is called …", "Email", ["Regular SMS", "Postal letter", "Telegram"], "Email = electronic mail, a letter over the internet."],
  ["Everything we do on the internet leaves a …", "Digital footprint", ["Footprint in the sand", "Shadow", "No trace at all"], "A digital footprint is hard to erase — be careful before uploading."],
  ["Other people's work on the internet must not be …", "Claimed as our own work", ["Studied with permission", "Credited to its source", "Respected"], "Claiming others' work as your own = plagiarism. Credit the source!"],
  ["Before downloading a new app or game, we should …", "Ask permission and check together with parents / teacher", ["Download everything right away", "Click the ads that appear", "Turn off the antivirus"], "Random downloads can contain viruses. Always ask permission first."],
  ["A good distance between our eyes and a computer screen is about …", "50–70 cm (an arm's length)", ["5 cm", "As close as possible", "3 metres"], "Keep a viewing distance and rest your eyes every 20 minutes."],
  ["Wi-Fi is a technology for connecting devices …", "Without cables (wireless)", ["With long cables", "Through paper", "With string"], "Wi-Fi uses radio waves, without cables."],
  ["Computers were originally created mainly to help with …", "Calculating", ["Playing games", "Watching films", "Drawing"], "The first computers were giant calculating machines."],
];
const FLOW_PAIRS_EN: readonly (readonly [string, string])[] = [
  ["Oval (terminator)", "Start and finish"],
  ["Rectangle", "A process / work step"],
  ["Diamond", "A decision (a yes / no choice)"],
  ["Parallelogram", "Data input and output"],
  ["Arrow (flow line)", "The direction of the process flow"],
];
const MALWARE_PAIRS_EN: readonly (readonly [string, string])[] = [
  ["Virus", "Attaches to files and spreads when the file is opened"],
  ["Worm", "Spreads by itself through networks without needing a file"],
  ["Trojan", "Disguises itself as a good program while being harmful"],
  ["Ransomware", "Locks the victim's data and demands a ransom"],
  ["Spyware", "Secretly spies on the user's activity"],
  ["Phishing", "Tricks victims into giving personal data"],
];
const SHORTCUT_PAIRS_EN: readonly (readonly [string, string])[] = [
  ["Ctrl + C", "Copies (copy) text or a file"],
  ["Ctrl + V", "Pastes (paste) the copied content"],
  ["Ctrl + X", "Cuts (cut) text or a file"],
  ["Ctrl + Z", "Undoes the last action (undo)"],
  ["Ctrl + S", "Saves the document"],
  ["Ctrl + A", "Selects all content in the document"],
  ["Ctrl + P", "Prints the document"],
  ["Ctrl + F", "Finds a word in a document / page"],
];
const JARINGAN_PAIRS_EN: readonly (readonly [string, string])[] = [
  ["Switch", "Connects devices within one local network"],
  ["Access point", "Broadcasts a Wi-Fi signal for wireless devices"],
  ["Server", "A computer providing services and data to other computers"],
  ["ISP", "A company providing internet services"],
  ["Fibre-optic cable", "Sends data with light, very fast"],
  ["Bluetooth", "Connects nearby devices without cables"],
];
const PROTOKOL_PAIRS_EN: readonly (readonly [string, string])[] = [
  ["HTTP", "Web page transfer without encryption"],
  ["HTTPS", "Encrypted (secure) web page transfer"],
  ["FTP", "File transfer between computers"],
  ["SMTP", "Sends email out from the sender"],
  ["POP3", "Downloads email from the server to the device"],
  ["IMAP", "Accesses email that stays stored on the server"],
  ["TCP", "Reliable, ordered data delivery"],
  ["UDP", "Fast data delivery without order guarantee"],
];
const SMP_TIK_FACTS_EN: Fact[] = [
  ["The main task of an operating system is to …", "Manage the hardware and run applications", ["Type documents", "Only play music", "Print photos"], "An OS such as Windows, Linux, Android manages all the computer's work."],
  ["In a spreadsheet, the formula for adding up data is …", "=SUM", ["=TOTAL", "=ADDUP", "=PLUS"], "Spreadsheet formulas start with the = sign. =SUM adds values up."],
  ["In a spreadsheet, the formula for the average value is …", "=AVERAGE", ["=MEAN", "=AVG2", "=SUM"], "=AVERAGE calculates the average."],
  ["The meeting point of a row and a column in a spreadsheet is called a …", "Cell", ["Table", "Chart", "Page"], "A cell is the box where a row (number) and a column (letter) meet."],
  ["An ordered sequence of logical steps for solving a problem is called an …", "Algorithm", ["Finished program", "Data", "Error"], "An algorithm = logical steps; a program is its code form."],
  ["A flow diagram that pictures an algorithm with symbols is called a …", "Flowchart", ["Mind map", "Bar chart", "Poster"], "A flowchart uses standard symbols: terminator, process, decision, input/output."],
  ["Two-factor authentication (2FA) makes an account safer because it …", "Needs an extra code besides the password", ["Makes the password short", "Needs no password", "Makes the account public"], "2FA = password + a one-time code from your device."],
  ["A computer network within one school/building is called a …", "LAN", ["WAN", "MAN", "Internet"], "LAN = Local Area Network (local); MAN = city; WAN = wide area."],
];
const SMP_TIK_FACTS2_EN: Fact[] = [
  ["Storing data on internet servers so it can be accessed from anywhere is called …", "Cloud computing", ["Fogging", "Offline storage", "Floppy disk"], "Cloud: data is stored in data centres and accessed via the internet."],
  ["A file with the .zip extension is …", "A compressed archive containing one / many files", ["An image file", "A song file", "Definitely a virus program"], ".zip shrinks and bundles files."],
  ["The 'I am not a robot' test (CAPTCHA) aims to …", "Make sure the user is a human, not a bot", ["Speed up the internet", "Remove viruses", "Test typing speed"], "CAPTCHA filters out automatic bots."],
  ["Incognito mode in a browser …", "Does not save history on that device, but activity is still visible to the network", ["Makes us completely anonymous", "Erases all traces on the internet", "Blocks all ads"], "Incognito is only local; the ISP/sites can still see activity."],
  ["Updating apps and the operating system is important because it …", "Patches security holes and fixes bugs", ["Makes the battery last forever", "Deletes all data", "Is useless"], "Regular updates are a basic security defence."],
  ["The internet speed unit 'Mbps' stands for …", "Megabits per second", ["Megabytes per unit", "Metres per second", "Megapixels"], "Mbps = megabits per second (note: bits, not bytes)."],
];
const SMA_TIK_FACTS_EN: Fact[] = [
  ["The SQL command for retrieving / displaying data from a table is …", "SELECT", ["INSERT", "DELETE", "UPDATE"], "SELECT reads data; INSERT adds; UPDATE changes; DELETE removes."],
  ["In a database, one complete row of data is called a …", "Record", ["Field", "Table", "Key"], "Row = record; column = field/attribute."],
  ["The key that connects one table to another is called a …", "Foreign key", ["Primary key", "Candidate key", "Super key"], "A foreign key points to a primary key in another table."],
  ["DNS in a network functions to …", "Translate domain names into IP addresses", ["Encrypt all data", "Speed up the processor", "Store passwords"], "DNS = the internet's phone book: name → IP address."],
  ["An IPv4 address consists of 4 numbers, each ranging …", "From 0 to 255", ["From 0 to 100", "From 1 to 10", "From 0 to 999"], "Each IPv4 octet = 8 bits → 0–255."],
  ["Computational thinking that means breaking a big problem into small parts is called …", "Decomposition", ["Abstraction", "Pattern recognition", "Debugging"], "The four pillars: decomposition, pattern recognition, abstraction, algorithms."],
  ["Computational thinking that means focusing on what matters and ignoring irrelevant details is called …", "Abstraction", ["Decomposition", "Pattern recognition", "Compilation"], "Abstraction filters only what is important."],
  ["A VPN makes an internet connection safer because it …", "Creates an encrypted path between the device and the server", ["Removes all viruses", "Makes the internet free", "Only turns off ads"], "A VPN encrypts data traffic through a secure tunnel."],
];
const SMA_TIK_FACTS2_EN: Fact[] = [
  ["Asymmetric encryption uses a pair of keys, namely …", "A public key and a private key", ["One shared single key", "Only a password", "A fingerprint"], "The public key encrypts; the private (secret) key decrypts."],
  ["Hashing differs from encryption because hashing is …", "One-way — it cannot be turned back into the original data", ["Two-way like encryption", "Only for images", "Always guessable"], "Hashes are used to check integrity & store password fingerprints."],
  ["A firewall in a network functions to …", "Filter data traffic coming in and going out", ["Speed up the processor", "Store backup files", "Cool the server"], "A firewall is the network's gatekeeper."],
  ["The Internet of Things (IoT) is the concept of …", "Everyday objects connected to the internet exchanging data", ["Internet only for computers", "A special satellite network", "Online games"], "IoT examples: smart lamps, online CCTV, farm sensors."],
  ["In machine learning, a computer learns from …", "Large amounts of training data", ["Commands typed one by one", "Manual books", "Random guesses"], "ML models find patterns from training data."],
  ["Software services over the internet without installation (e.g. online documents) are called …", "SaaS (Software as a Service)", ["PaaS", "IaaS", "Firmware"], "SaaS: use it directly in a browser, managed by the provider."],
];
const SMP_INF_FACTS_EN: Fact[] = [
  ["The 'if … then …' structure in programming is called the … structure", "Branching / selection", ["Looping", "Function", "Array"], "If-then is the selection/branching structure."],
  ["The sorting algorithm that repeatedly compares pairs of neighbouring elements is …", "Bubble sort", ["Binary search", "Merge sort", "Hashing"], "Bubble sort swaps neighbouring pairs until sorted."],
  ["The protocol used for secure web page transfer is …", "HTTPS", ["FTP", "SMTP", "POP3"], "HTTPS = HTTP + TLS encryption."],
  ["The smallest unit of data is the …", "Bit", ["Byte", "Kilobyte", "Gigabyte"], "The bit is the smallest; 8 bits = 1 byte."],
  ["A computer network covering one building/school area is called a …", "LAN (Local Area Network)", ["WAN", "MAN", "Internet"], "LAN = local network; MAN = city; WAN = wide inter-regional."],
  ["The device that connects two different networks and chooses the best path is a …", "Router", ["Hub", "Repeater", "UTP cable"], "A router forwards packets between networks based on IP addresses."],
  ["The open-source operating system is …", "Linux", ["Windows", "macOS", "iOS"], "Linux is open source; Windows & macOS are proprietary."],
  ["1 Kilobyte (KB) equals … bytes", "1,024 bytes", ["1,000 bytes", "8 bytes", "1,000,000 bytes"], "In computing, 1 KB = 1,024 bytes (2¹⁰)."],
  ["The file extension for camera photos is generally …", ".jpg / .png", [".docx", ".mp3", ".exe"], ".docx document, .mp3 audio, .exe program."],
];
const SMA_INF_FACTS_EN: Fact[] = [
  ["The time complexity of the binary search algorithm is …", "O(log n)", ["O(n)", "O(n log n)", "O(n²)"], "Binary search halves the data at each step → O(log n)."],
  ["In a relational database, the attribute that uniquely identifies each row is called the …", "Primary key", ["Foreign key", "Ordinary index", "View"], "Primary key: unique & never NULL."],
];

/* ================= GENERATOR HITUNGAN (Bahasa Inggris) ================= */
const EMOJIS_EN = ["⭐", "🍎", "🐶", "🌸", "🍌", "🐱", "🍓", "🦋", "🍇", "🐠"] as const;
const ITEMS_EN = ["pencils", "books", "candies", "stickers", "marbles", "apples", "oranges", "balloons", "cards", "biscuits"] as const;
const NAMES_EN = ["Aisyah", "Budi", "Caca", "Dimas", "Eka", "Fajar", "Gita", "Hana", "Ivan", "Joko", "Kirana", "Lukman", "Maya", "Nadia", "Putri", "Rafi", "Sinta", "Tono", "Umar", "Vina", "Wati", "Yoga", "Zahra", "Rina", "Andi", "Sari", "Rizky", "Dewi", "Bagas", "Intan"] as const;

/* ---------- TK ---------- */
const tkCountEn: LGen = (level) => {
  const e = pick(EMOJIS_EN);
  const n = ri(2, 4 + level * 2);
  return mkNumEn(`Count the pictures: ${e.repeat(n)} — How many are there?`, n, [n - 1, n + 1, n + 2].filter((x) => x > 0), `Count one by one: there are ${n}.`, e, false);
};
const tkAddSubEn: LGen = (level) => {
  const max = 4 + level * 3;
  const a = ri(1, max);
  const b = ri(1, max);
  if (Math.random() < 0.5 || a < b) {
    return mkNumEn(`${a} + ${b} = …`, a + b, [a + b - 1, a + b + 1, a + b + 2], `${a} + ${b} = ${a + b}.`, "🔢", false);
  }
  return mkNumEn(`${a} − ${b} = …`, a - b, [a - b + 1, a - b - 1, a - b + 2].filter((x) => x >= 0), `${a} − ${b} = ${a - b}.`, "🔢", false);
};
const tkCompareEn: LGen = () => {
  const set = sample([3, 5, 7, 8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 24, 25, 27, 30], 3);
  const smallest = Math.random() < 0.5;
  const ans = smallest ? Math.min(...set) : Math.max(...set);
  return mkq(
    `Look at the numbers: ${set.join(", ")} — The ${smallest ? "SMALLEST" : "BIGGEST"} number is …`,
    String(ans), set.filter((x) => x !== ans).map(String),
    `Sort them first: ${[...set].sort((x, y) => x - y).join(" < ")}. The ${smallest ? "smallest" : "biggest"} is ${ans}.`,
    "🔢", false,
  );
};
const tkMissingEn: LGen = (level) => {
  const step = pick(level >= 3 ? [1, 2, 5, 10] : [1, 2]);
  const start = ri(1, 12);
  const seq = [0, 1, 2, 3, 4].map((i) => start + i * step);
  const miss = ri(1, 3);
  const shown = seq.map((v, i) => (i === miss ? "__" : String(v))).join(", ");
  const ans = seq[miss] as number;
  return mkNumEn(`Which number is missing? ${shown}`, ans, [ans - step, ans + step, ans + 1].filter((x) => x > 0 && x !== ans), `The pattern jumps by ${step}: after ${seq[miss - 1]} comes ${ans}.`, "🔢", false);
};
const tkBeforeAfterEn: LGen = (level) => {
  const max = 5 + level * 5;
  const n = ri(2, max);
  const before = Math.random() < 0.5;
  const ans = before ? n - 1 : n + 1;
  return mkNumEn(`The number ${before ? "BEFORE" : "AFTER"} ${n} is …`, ans, [ans - 1, ans + 1, n + (before ? 1 : -1) * 2].filter((x) => x >= 0 && x !== ans), `The order is: ${before ? `${ans}, ${n}` : `${n}, ${ans}`} — so ${before ? "before" : "after"} ${n} is ${ans}.`, "🔢", false);
};
const tkStoryCountEn: LGen = (level) => {
  const name = pick(NAMES_EN);
  const item = pick(ITEMS_EN);
  const a = ri(2, 4 + level * 2);
  const b = ri(1, 3 + level);
  if (Math.random() < 0.5) {
    return mkNumEn(`${name} has ${a} ${item}. Then ${name} is given ${b} more ${item}. Now ${name} has … ${item}`, a + b, [a + b - 1, a + b + 1, a].filter((x) => x > 0), `${a} + ${b} = ${a + b} ${item}.`, "🎁", false);
  }
  const lost = Math.min(b, a - 1);
  return mkNumEn(`${name} has ${a} ${item}. ${name} gives ${lost} ${item} to a friend. ${name} has … ${item} left`, a - lost, [a - lost + 1, a - lost - 1, a].filter((x) => x >= 0), `${a} − ${lost} = ${a - lost} ${item}.`, "🎁", false);
};
const tkEngArrangeEn: LGen = () => {
  const words: readonly string[] = ["CAT", "DOG", "PIG", "COW", "HEN", "BEE", "ANT", "EGG", "SUN", "BUS", "TEN", "RED", "FISH", "CAKE", "BIRD", "LION", "BEAR", "DUCK", "GOAT", "BALL"];
  const w = pick(words);
  const letters = shuffle(w.split("")).join(" – ");
  const others = sample(words.filter((x) => x !== w), 2).map((x) => x[0] + x.slice(1).toLowerCase());
  const correct = w[0] + w.slice(1).toLowerCase();
  return mkq(`Arrange the letters to form the correct word! ${letters}`, correct, others, `${w.split("").join("–")} becomes ${w}.`, "🔤", false);
};
const tkEngPairsEn: LGen = (level) => pairGenL({
  pairs: [
    ["cat", "an animal that says “meow”"], ["dog", "an animal that says “woof”"], ["bird", "an animal that can fly and sings"],
    ["fish", "an animal that swims in water"], ["duck", "a bird that swims and says “quack”"],
    ["red", "the colour of a ripe tomato"], ["blue", "the colour of the clear sky"], ["yellow", "the colour of a banana"],
    ["green", "the colour of leaves"], ["black", "the colour of the night sky"],
    ["one", "1"], ["two", "2"], ["three", "3"], ["four", "4"], ["five", "5"],
    ["apple", "a round fruit, red or green"], ["banana", "a long yellow fruit"], ["sun", "the star that shines in the daytime"],
    ["moon", "the bright object in the night sky"], ["star", "a tiny shining light in the night sky"],
    ["book", "something we read"], ["ball", "a round toy we kick and throw"], ["milk", "a white drink from a cow"],
    ["egg", "food laid by a hen"], ["hand", "the part of the body with five fingers"],
  ] as readonly (readonly [string, string])[],
  askA: (a) => `What is “${a}”? “${a}” is …`,
  askB: (b) => `Which English word means “${b}”?`,
  exA: (a, b) => `“${a}” means ${b}.`,
  exB: (a, b) => `“${b}” in English is “${a}”.`,
  four: false,
})(level);

/* ---------- SD ---------- */
const sdAddSubEn: LGen = (level) => {
  const max = [60, 300, 1500, 12000, 150000][level - 1] ?? 60;
  const a = ri(5, max);
  const b = ri(4, max);
  if (Math.random() < 0.5) return mkNumEn(`What is ${enFmt(a)} + ${enFmt(b)}?`, a + b, [a + b - 10, a + b + 10, a + b - 100], `${enFmt(a)} + ${enFmt(b)} = ${enFmt(a + b)}.`);
  const [x, y] = a >= b ? [a, b] : [b, a];
  return mkNumEn(`What is ${enFmt(x)} − ${enFmt(y)}?`, x - y, [x - y + 10, x - y - 10, x - y + 100].filter((v) => v >= 0), `${enFmt(x)} − ${enFmt(y)} = ${enFmt(x - y)}.`);
};
const sdMulDivEn: LGen = (level) => {
  if (Math.random() < 0.5) {
    const a = level >= 4 ? ri(12, 48) : ri(3, 6 + level * 3);
    const b = level >= 5 ? ri(12, 36) : ri(3, 9);
    return mkNumEn(`What is ${a} × ${b}?`, a * b, [a * b - a, a * b + b, a * b + 10], `${a} × ${b} = ${a * b}.`);
  }
  const b = ri(2, 9 + level);
  const q = ri(3, 9 + level * 4);
  return mkNumEn(`What is ${b * q} ÷ ${b}?`, q, [q - 1, q + 1, q + 2], `${b * q} ÷ ${b} = ${q}, because ${b} × ${q} = ${b * q}.`);
};
const sdMixedEn: LGen = (level) => {
  if (level < 2) return null;
  const a = ri(3, 9 + level * 2);
  const b = ri(3, 9);
  const c = ri(2, 40);
  return mkNumEn(`What is ${a} × ${b} + ${c}?`, a * b + c, [a * (b + c), a * b - c, a * b + c + 10], `Do the multiplication first: ${a}×${b}=${a * b}, then + ${c} = ${a * b + c}.`);
};
const sdFractionEn: LGen = (level) => {
  if (level < 3) return null;
  const den = pick([4, 5, 6, 8, 10, 12]);
  const a = ri(1, den - 2);
  const b = ri(1, den - 1 - a);
  const sum = a + b;
  const g = gcd(sum, den);
  const ans = `${sum / g}/${den / g}`;
  const wrong = [`${sum}/${den}`, `${a + b + 1}/${den}`, `${sum}/${den + 1}`].filter((w) => w !== ans);
  return mkq(`What is ${a}/${den} + ${b}/${den}?`, ans, wrong, `Same denominator: (${a}+${b})/${den} = ${sum}/${den}${g > 1 ? `, simplified to ${ans}` : ""}.`);
};
const sdFpbKpkEn: LGen = (level) => {
  if (level < 4) return null;
  const pairs: readonly (readonly [number, number])[] = [[12, 18], [16, 24], [20, 30], [24, 36], [18, 27], [15, 25], [28, 42], [36, 48], [8, 12], [9, 15]];
  const p = pick(pairs);
  const a = p[0];
  const b = p[1];
  if (Math.random() < 0.5) {
    const v = gcd(a, b);
    return mkNumEn(`The HCF (highest common factor) of ${a} and ${b} is …`, v, [v + 2, v * 2, Math.max(2, v - 2)], `The greatest common factor of ${a} and ${b} is ${v}.`);
  }
  const v = lcm(a, b);
  return mkNumEn(`The LCM (lowest common multiple) of ${a} and ${b} is …`, v, [v + a, v * 2, v - b], `The lowest common multiple of ${a} and ${b} is ${v}.`);
};
const sdGeometryEn: LGen = (level) => {
  const kind = ri(0, 2);
  if (kind === 0) {
    const s = ri(3, 8 + level * 4);
    return Math.random() < 0.5
      ? mkNumEn(`The perimeter of a square with side ${s} cm is … cm`, 4 * s, [2 * s, s * s, 4 * s + 4], `Square perimeter = 4 × ${s} = ${4 * s} cm.`)
      : mkNumEn(`The area of a square with side ${s} cm is … cm²`, s * s, [4 * s, 2 * s, s * s + s], `Square area = ${s} × ${s} = ${s * s} cm².`);
  }
  if (kind === 1) {
    const p = ri(4, 10 + level * 4);
    const l = ri(3, p - 1);
    return Math.random() < 0.5
      ? mkNumEn(`The perimeter of a rectangle ${p} cm × ${l} cm is … cm`, 2 * (p + l), [p + l, p * l, 2 * (p + l) + 4], `P = 2×(${p}+${l}) = ${2 * (p + l)} cm.`)
      : mkNumEn(`The area of a rectangle ${p} cm × ${l} cm is … cm²`, p * l, [2 * (p + l), p + l, p * l + p], `A = ${p} × ${l} = ${p * l} cm².`);
  }
  const a = ri(4, 12 + level * 2);
  const t = pick([4, 6, 8, 10, 12]);
  return mkNumEn(`The area of a triangle with base ${a} cm and height ${t} cm is … cm²`, (a * t) / 2, [a * t, (a * t) / 2 + a, a + t], `A = ½ × ${a} × ${t} = ${(a * t) / 2} cm².`);
};
const sdAverageEn: LGen = (level) => {
  if (level < 3) return null;
  const n = pick([4, 5]);
  const vals = Array.from({ length: n }, () => ri(4, 10) * 10 + pick([0, 5]));
  const avg = vals.reduce((s, v) => s + v, 0) / n;
  if (!Number.isInteger(avg)) return sdAverageEn(level);
  return mkNumEn(`The average of the scores ${vals.join(", ")} is …`, avg, [avg - 5, avg + 5, avg + 10], `Total = ${vals.reduce((s, v) => s + v, 0)}, divided by ${n} = ${avg}.`);
};
const sdSequenceEn: LGen = (level) => {
  const start = ri(2, 20);
  const diff = ri(2, 3 + level * 2);
  const seq = [0, 1, 2, 3].map((i) => start + i * diff);
  const ans = start + 4 * diff;
  return mkNumEn(`Number pattern: ${seq.join(", ")}, … The next number is …`, ans, [ans - diff, ans + diff, ans + 1], `The pattern always adds ${diff}, so next is ${seq[3]} + ${diff} = ${ans}.`);
};
const sdWordProblemEn: LGen = (level) => {
  if (level < 2) return null;
  const name = pick(NAMES_EN);
  const item = pick(ITEMS_EN);
  const qty = ri(2, 6 + level * 2);
  const price = pick([500, 1000, 1500, 2000, 2500, 3000, 5000]) * (level >= 4 ? ri(1, 4) : 1);
  if (Math.random() < 0.5) {
    return mkNumEn(`${name} buys ${qty} ${item} at Rp${enFmt(price)} each. The total to pay is …`, qty * price, [qty * price - price, qty * price + price, (qty + 1) * price], `${qty} × Rp${enFmt(price)} = Rp${enFmt(qty * price)}.`);
  }
  const money = pick([20000, 50000, 100000]);
  const total = qty * price;
  if (total >= money) return sdWordProblemEn(level);
  return mkNumEn(`${name} buys ${qty} ${item} at Rp${enFmt(price)} each and pays with Rp${enFmt(money)}. The change is …`, money - total, [money - total + price, money - total - 1000, total], `Total shopping ${qty}×${enFmt(price)} = Rp${enFmt(total)}. Change = ${enFmt(money)} − ${enFmt(total)} = Rp${enFmt(money - total)}.`);
};
const sdRoundEn: LGen = (level) => {
  if (level < 2) return null;
  if (level < 4) {
    const n = ri(12, 995);
    const rounded = Math.round(n / 10) * 10;
    return mkNumEn(`The number ${enFmt(n)} rounded to the nearest ten becomes …`, rounded, [rounded - 10, rounded + 10, Math.floor(n / 10) * 10 === rounded ? rounded + 10 : Math.floor(n / 10) * 10], `The ones digit is ${n % 10} ${n % 10 >= 5 ? "≥ 5, round up" : "< 5, round down"} → ${enFmt(rounded)}.`);
  }
  const n = ri(120, 9950);
  const rounded = Math.round(n / 100) * 100;
  return mkNumEn(`The number ${enFmt(n)} rounded to the nearest hundred becomes …`, rounded, [rounded - 100, rounded + 100, Math.floor(n / 100) * 100 === rounded ? rounded + 100 : Math.floor(n / 100) * 100], `Look at the tens digit (${Math.floor(n / 10) % 10}) → rounds to ${enFmt(rounded)}.`);
};
const sdPercentEn: LGen = (level) => {
  if (level < 3) return null;
  const pct = pick([10, 20, 25, 50, 75]);
  const base = pick([100, 200, 240, 300, 400, 500, 600, 800, 1000]) * (level >= 5 ? ri(1, 3) : 1);
  const v = (pct * base) / 100;
  return mkNumEn(`What is ${pct}% of ${enFmt(base)}?`, v, [v + base / 10, Math.max(1, v - base / 20), v * 2], `${pct}% × ${enFmt(base)} = ${enFmt(v)}.`);
};
const sdClockEn: LGen = (level) => {
  if (level < 2) return null;
  const h = ri(6, 15);
  const m = pick([0, 15, 30, 45]);
  const durH = level >= 4 ? ri(1, 3) : ri(1, 2);
  const durM = level >= 3 ? pick([0, 15, 30, 45]) : 0;
  const total = h * 60 + m + durH * 60 + durM;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  const ans = `${String(eh).padStart(2, "0")}.${String(em).padStart(2, "0")}`;
  const wrongMin = (total + 30) % (24 * 60);
  const wrong = [
    `${String(Math.floor(wrongMin / 60)).padStart(2, "0")}.${String(wrongMin % 60).padStart(2, "0")}`,
    `${String((eh + 1) % 24).padStart(2, "0")}.${String(em).padStart(2, "0")}`,
    `${String(eh).padStart(2, "0")}.${String((em + 15) % 60).padStart(2, "0")}`,
  ].filter((w) => w !== ans);
  return mkq(`An activity starts at ${String(h).padStart(2, "0")}.${String(m).padStart(2, "0")} and lasts ${durH} hour(s)${durM ? ` ${durM} minutes` : ""}. The activity finishes at …`, ans, wrong, `${String(h).padStart(2, "0")}.${String(m).padStart(2, "0")} + ${durH} hour(s)${durM ? ` ${durM} minutes` : ""} = ${ans}.`);
};
const sdUnitEn: LGen = (level) => {
  if (level < 2) return null;
  const units: readonly (readonly [string, string, number])[] = [
    ["km", "m", 1000], ["m", "cm", 100], ["kg", "g", 1000], ["hours", "minutes", 60],
    ["minutes", "seconds", 60], ["weeks", "days", 7], ["years", "months", 12], ["dozen", "pieces", 12],
  ];
  const u = pick(units);
  const qty = ri(2, level >= 4 ? 25 : 12);
  const ans = qty * u[2];
  return mkNumEn(`${qty} ${u[0]} = … ${u[1]}`, ans, [ans - u[2], ans + u[2], qty * (u[2] === 1000 ? 100 : u[2] * 10)], `1 ${u[0]} = ${enFmt(u[2])} ${u[1]}, so ${qty} ${u[0]} = ${qty} × ${enFmt(u[2])} = ${enFmt(ans)} ${u[1]}.`);
};
const sdFracCompareEn: LGen = (level) => {
  if (level < 3) return null;
  const b = pick([3, 4, 5, 6, 8]);
  const d = pick([3, 4, 5, 6, 8].filter((x) => x !== b));
  const a = ri(1, b - 1);
  const c = ri(1, d - 1);
  const left = a * d;
  const right = c * b;
  if (left === right) return sdFracCompareEn(level);
  const bigger = left > right ? `${a}/${b}` : `${c}/${d}`;
  const smaller = left > right ? `${c}/${d}` : `${a}/${b}`;
  return mkq(`The BIGGER fraction between ${a}/${b} and ${c}/${d} is …`, bigger, [smaller, "They are equal", `${a + c}/${b + d}`], `Cross-multiply: ${a}×${d}=${left} compared with ${c}×${b}=${right}. The bigger one is ${bigger}.`, undefined, false);
};
const sdEngPastEn: LGen = () => {
  const v = pick(EN_PAST_EN);
  const name = pick(["Sinta", "Budi", "Rina", "Andi", "Dewi", "Rafi"]);
  const places: readonly (readonly [string, string])[] = [
    ["go", "to school"], ["eat", "breakfast at home"], ["drink", "a glass of milk"], ["read", "a story book"],
    ["write", "a letter"], ["see", "a rainbow"], ["buy", "new shoes"], ["swim", "in the pool"], ["sleep", "early last night"],
  ];
  const scene = places.find((p) => p[0] === v[0]);
  const tail = scene ? scene[1] : "";
  const wrong = sample(EN_PAST_EN.filter((p) => p[1] !== v[1]), 3).map((p) => p[1]);
  return mkq(`Yesterday, ${name} ___${tail ? ` ${tail}` : ""}. (verb: ${v[0]})`, v[1], wrong, `The past tense of “${v[0]}” is “${v[1]}”.`);
};
const planetGenEn: LGen = () => {
  const planets = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];
  const i = ri(0, planets.length - 1);
  const name = planets[i] as string;
  if (Math.random() < 0.5) {
    return mkq(`The planet exactly AFTER ${name} (further from the Sun) is …`, planets[i + 1] ?? "None, it is the last planet", sample(planets.filter((p) => p !== planets[i + 1]), 3), `Planet order: ${planets.join(" – ")}.`);
  }
  return mkq(`The planet in position ${i + 1} from the Sun is …`, name, sample(planets.filter((p) => p !== name), 3), `Order of the planets from the Sun: ${planets.join(" – ")}.`);
};

/* ---------- SMP ---------- */
const smpEquationEn: LGen = (level) => {
  const a = ri(2, 3 + level);
  const x = ri(2, 12);
  const b = ri(1, 15);
  const c = a * x + b;
  return mkNumEn(`If ${a}x + ${b} = ${c}, then the value of x is …`, x, [x - 1, x + 1, x + 2], `${a}x = ${c} − ${b} = ${c - b}, so x = ${c - b} ÷ ${a} = ${x}.`);
};
const smpNegOpsEn: LGen = (level) => {
  const a = ri(2, 6 + level * 2);
  const b = ri(2, 6 + level);
  const mode = ri(0, 2);
  if (mode === 0) return mkNumEn(`What is (−${a}) × ${b}?`, -a * b, [a * b, -a * b + a, -a * b - b], `Negative × positive = negative: (−${a})×${b} = ${-a * b}.`);
  if (mode === 1) return mkNumEn(`What is (−${a})²?`, a * a, [-a * a, 2 * a, a * a + a], `(−${a})² = (−${a})×(−${a}) = ${a * a} (negative × negative = positive).`);
  return mkNumEn(`What is ${a} − (−${b})?`, a + b, [a - b, -(a + b), a + b + 1], `Subtracting a negative is the same as adding: ${a} − (−${b}) = ${a} + ${b} = ${a + b}.`);
};
const smpSequenceEn: LGen = (level) => {
  const a = ri(2, 15);
  const d = ri(2, 4 + level);
  const n = ri(6, 12);
  const un = a + (n - 1) * d;
  return mkNumEn(`The ${n}th term of the arithmetic sequence ${a}, ${a + d}, ${a + 2 * d}, … is …`, un, [un - d, un + d, a + n * d], `Un = a + (n−1)d = ${a} + ${n - 1}×${d} = ${un}.`);
};
const smpGradientEn: LGen = (level) => {
  if (level < 3) return null;
  const x1 = ri(0, 4);
  const y1 = ri(0, 6);
  const m = ri(1, 4);
  const dx = ri(2, 5);
  const x2 = x1 + dx;
  const y2 = y1 + m * dx;
  return mkNumEn(`The gradient of the line through the points (${x1}, ${y1}) and (${x2}, ${y2}) is …`, m, [m + 1, m === 1 ? m + 3 : m - 1, m + 2], `m = (y₂−y₁)/(x₂−x₁) = (${y2}−${y1})/(${x2}−${x1}) = ${m * dx}/${dx} = ${m}.`);
};
const smpProbabilityEn: LGen = (level) => {
  if (level < 2) return null;
  if (Math.random() < 0.5) {
    const faces = [1, 2, 3, 4, 5, 6];
    const primes = faces.filter(isPrime);
    return mkq("A die is rolled once. The probability of getting a prime number is …", `${primes.length}/6 = 1/2`, ["1/6", "1/3", "2/3"], `Prime faces: ${primes.join(", ")} → ${primes.length} out of 6 outcomes = 1/2.`);
  }
  const red = ri(2, 6);
  const blue = ri(2, 6);
  const total = red + blue;
  const g = gcd(red, total);
  // Distractors must have a DIFFERENT fraction value from the answer
  // (e.g. 2/4 equals 1/2) and from each other.
  const seenVal = new Set<string>([`${red / g}/${total / g}`]);
  const ds: string[] = [];
  for (const [n, d] of [[red, total + 2], [red + 1, total], [blue, total + 2], [red + 1, total + 1], [blue + 1, total + 1]] as const) {
    const gg = gcd(n, d);
    const key = `${n / gg}/${d / gg}`;
    if (seenVal.has(key)) continue;
    seenVal.add(key);
    ds.push(`${n}/${d}`);
    if (ds.length === 3) break;
  }
  if (ds.length < 3) return null;
  return mkq(`A bag contains ${red} red marbles and ${blue} blue marbles. The probability of picking one red marble is …`, `${red / g}/${total / g}`, ds, `Probability = number of red ÷ total = ${red} ÷ ${total} = ${red / g}/${total / g}.`);
};
const smpScaleEn: LGen = (level) => {
  if (level < 2) return null;
  const scale = pick([100000, 200000, 250000, 500000, 1000000]);
  const cm = ri(2, 9);
  const km = (cm * scale) / 100000;
  return mkNumEn(`A map has a scale of 1 : ${enFmt(scale)}. The distance between two places on the map is ${cm} cm. The real distance is … km`, km, [km / 2, km * 2, km + 5], `${cm} × ${enFmt(scale)} cm = ${enFmt(cm * scale)} cm = ${km} km.`);
};
const smpPhysicsEn: LGen = (level) => {
  const kind = ri(0, 2);
  if (kind === 0) {
    const m = ri(2, 4 + level * 2);
    const a = ri(2, 9);
    return mkNumEn(`An object of mass ${m} kg is accelerated at ${a} m/s². The force acting on it is … N`, m * a, [m + a, m * a + m, m * a - a], `Newton's Second Law: F = m × a = ${m} × ${a} = ${m * a} N.`);
  }
  if (kind === 1) {
    const s = pick([60, 80, 100, 120, 150, 200, 240, 300]);
    const t = pick([2, 3, 4, 5, 6, 10]);
    const v = s / t;
    if (!Number.isInteger(v)) return smpPhysicsEn(level);
    return mkNumEn(`A car travels ${s} m in ${t} seconds. Its average speed is … m/s`, v, [v + 2, v - 2, v * 2], `v = s ÷ t = ${s} ÷ ${t} = ${v} m/s.`);
  }
  const m = ri(2, 20 + level * 10);
  const vol = pick([2, 4, 5, 10]);
  const rho = m / vol;
  if (!Number.isInteger(rho)) return smpPhysicsEn(level);
  return mkNumEn(`An object has a mass of ${m} kg and a volume of ${vol} m³. Its density is … kg/m³`, rho, [rho + 1, rho * 2, Math.max(1, rho - 1)], `ρ = m ÷ V = ${m} ÷ ${vol} = ${rho} kg/m³.`);
};
const phGenEn: LGen = (level) => {
  if (level < 3) return null;
  const ph = ri(1, 14);
  const cat = ph < 7 ? "Acidic" : ph === 7 ? "Neutral" : "Basic (alkaline)";
  return mkq(`A solution with pH = ${ph} is …`, cat, ["Acidic", "Neutral", "Basic (alkaline)"].filter((c) => c !== cat), `pH < 7 acidic, pH = 7 neutral, pH > 7 basic. pH ${ph} → ${cat.toLowerCase()}.`);
};
const binaryGenEn: LGen = (level) => {
  const bits = level >= 4 ? ri(4, 6) : level >= 2 ? ri(3, 4) : 3;
  let bin = "1";
  for (let i = 1; i < bits; i++) bin += Math.random() < 0.5 ? "0" : "1";
  const dec = parseInt(bin, 2);
  return mkNumEn(`The binary number ${bin} converted to decimal is …`, dec, [dec - 1, dec + 1, dec + 2], `${bin}₂ = ${bin.split("").reverse().map((b, i) => (b === "1" ? String(2 ** i) : "0")).join(" + ")} = ${dec}.`);
};
const smpDiscountEn: LGen = (level) => {
  if (level < 2) return null;
  const price = pick([50000, 80000, 100000, 120000, 150000, 200000, 250000, 400000]);
  const disc = pick([10, 20, 25, 30, 40, 50]);
  const pay = price - (price * disc) / 100;
  return mkNumEn(`A bag costs Rp${enFmt(price)} and gets a ${disc}% discount. The price to pay is …`, pay, [price - disc * 1000, pay + price / 10, price], `Discount = ${disc}% × ${enFmt(price)} = Rp${enFmt((price * disc) / 100)}. Pay = ${enFmt(price)} − ${enFmt((price * disc) / 100)} = Rp${enFmt(pay)}.`);
};
const smpProfitEn: LGen = (level) => {
  if (level < 3) return null;
  const buy = pick([20000, 25000, 40000, 50000, 80000, 100000]);
  const pct = pick([5, 10, 20, 25, 40, 50]);
  const profit = Math.random() < 0.6;
  const sell = profit ? buy + (buy * pct) / 100 : buy - (buy * pct) / 100;
  return mkq(`A trader buys an item for Rp${enFmt(buy)} and sells it for Rp${enFmt(sell)}. The percentage of ${profit ? "profit" : "loss"} is …`, `${pct}%`, [`${pct - 5}%`, `${pct + 5}%`, `${pct * 2}%`].filter((w) => !w.startsWith("-") && w !== `${pct}%`), `${profit ? "Profit" : "Loss"} = Rp${enFmt(Math.abs(sell - buy))}; ${enFmt(Math.abs(sell - buy))} ÷ ${enFmt(buy)} × 100% = ${pct}%.`);
};
const smpPythagEn: LGen = (level) => {
  if (level < 3) return null;
  const triples: readonly (readonly [number, number, number])[] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20], [10, 24, 26]];
  const t = pick(triples);
  const a = t[0]; const b = t[1]; const c = t[2];
  if (Math.random() < 0.5) {
    return mkNumEn(`A right-angled triangle has perpendicular sides of ${a} cm and ${b} cm. The length of the hypotenuse is … cm`, c, [c - 1, c + 2, a + b], `c = √(${a}² + ${b}²) = √${a * a + b * b} = ${c} cm.`);
  }
  return mkNumEn(`A right-angled triangle has a hypotenuse of ${c} cm and one perpendicular side of ${a} cm. The other perpendicular side is … cm`, b, [b - 2, b + 1, c - a], `b = √(${c}² − ${a}²) = √${c * c - a * a} = ${b} cm.`);
};
const smpCircleEn: LGen = (level) => {
  if (level < 2) return null;
  const r = pick([7, 14, 21, 28, 35]);
  if (Math.random() < 0.5) {
    const k = 2 * (22 / 7) * r;
    return mkNumEn(`The circumference of a circle with radius ${r} cm (π = 22/7) is … cm`, k, [k - 14, k + 22, (22 / 7) * r], `C = 2πr = 2 × 22/7 × ${r} = ${k} cm.`);
  }
  const area = (22 / 7) * r * r;
  return mkNumEn(`The area of a circle with radius ${r} cm (π = 22/7) is … cm²`, area, [area - 154, 2 * (22 / 7) * r, area + 154], `A = πr² = 22/7 × ${r}² = ${enFmt(area)} cm².`);
};
const smpVolumeEn: LGen = (level) => {
  if (Math.random() < 0.5) {
    const s = ri(3, 8 + level * 2);
    return mkNumEn(`The volume of a cube with edge ${s} cm is … cm³`, s * s * s, [s * s * 6, s * s, s * 12], `V = ${s}³ = ${enFmt(s * s * s)} cm³.`);
  }
  const p = ri(4, 12 + level);
  const l = ri(3, 9);
  const t = ri(2, 8);
  const v = p * l * t;
  return mkNumEn(`The volume of a cuboid measuring ${p} cm × ${l} cm × ${t} cm is … cm³`, v, [v + p * l, 2 * (p * l + p * t + l * t), v - t], `V = l×w×h = ${p}×${l}×${t} = ${enFmt(v)} cm³.`);
};
const smpAnglesEn: LGen = (_level) => {
  const x = ri(15, 80);
  if (Math.random() < 0.5) {
    return mkNumEn(`The angle complementary to ${x}° is …`, 90 - x, [90 - x + 10, 180 - x, x + 15], `Complementary angles add up to 90° → 90 − ${x} = ${90 - x}°.`);
  }
  const y = ri(95, 170);
  return mkNumEn(`The angle supplementary to ${y}° is …`, 180 - y, [180 - y + 10, 180 - y + 20, 270 - y], `Supplementary angles add up to 180° → 180 − ${y} = ${180 - y}°.`);
};
const smpTwoVarEn: LGen = (level) => {
  if (level < 4) return null;
  const x = ri(3, 20);
  const y = ri(2, x - 1);
  const s = x + y;
  const d = x - y;
  return mkNumEn(`If x + y = ${s} and x − y = ${d}, then the value of x is …`, x, [y, x + 1, s - x + 2], `Add the two equations: 2x = ${s} + ${d} = ${s + d} → x = ${x}. (y = ${y})`);
};

/* ---------- SMA ---------- */
const smaDerivativeEn: LGen = (level) => {
  const a = ri(1, 2 + level);
  const b = ri(1, 9);
  const c = ri(1, 9);
  if (level >= 4 && Math.random() < 0.5) {
    const x0 = ri(1, 4);
    const val = 2 * a * x0 + b;
    return mkNumEn(`If f(x) = ${a}x² + ${b}x + ${c}, then f'(${x0}) is …`, val, [val - b, val + 2, 2 * a + b], `f'(x) = ${2 * a}x + ${b}; f'(${x0}) = ${2 * a}×${x0} + ${b} = ${val}.`);
  }
  return mkq(`If f(x) = ${a}x² − ${b}x + ${c}, then f'(x) is …`, `${2 * a}x − ${b}`, [`${a}x − ${b}`, `${2 * a}x + ${c}`, `${2 * a}x − ${b + 1}`], `Derivative: d/dx(${a}x²)=${2 * a}x, d/dx(−${b}x)=−${b}, constant→0.`);
};
const smaLimitEn: LGen = () => {
  const a = ri(2, 9);
  return mkNumEn(`The value of lim (x→${a}) (x² − ${a * a})/(x − ${a}) is …`, 2 * a, [a, 2 * a - 1, a * a], `(x²−${a * a}) = (x−${a})(x+${a}); simplify → x+${a}; x=${a} → ${2 * a}.`);
};
const smaLogEn: LGen = (_level) => {
  const base = pick([2, 3, 5, 10]);
  const e1 = ri(1, 3);
  const e2 = ri(1, 3);
  const sum = e1 + e2;
  return mkNumEn(`The value of ${base}log ${base ** e1} + ${base}log ${base ** e2} is …`, sum, [sum - 1, sum + 1, e1 * e2], `${base}log ${base ** e1} = ${e1} and ${base}log ${base ** e2} = ${e2}; the total is ${sum}.`);
};
const smaSeriesEn: LGen = (level) => {
  const a = ri(2, 12);
  const d = ri(2, 3 + level);
  const n = ri(8, 15);
  const un = a + (n - 1) * d;
  if (level >= 3 && Math.random() < 0.5) {
    const sn = (n / 2) * (a + un);
    return mkNumEn(`The sum of the first ${n} terms of the arithmetic series ${a}, ${a + d}, ${a + 2 * d}, … is …`, sn, [sn - d * n, un * n, sn + a * n], `Un = ${a}+${n - 1}×${d} = ${un}; Sn = n/2 × (a+Un) = ${n}/2 × ${a + un} = ${sn}.`);
  }
  return mkNumEn(`The ${n}th term of the arithmetic sequence ${a}, ${a + d}, ${a + 2 * d}, … is …`, un, [un - d, un + d, a + n * d], `Un = a + (n−1)d = ${a} + ${n - 1}×${d} = ${un}.`);
};
const smaCombinationEn: LGen = (level) => {
  if (level < 3) return null;
  const n = ri(6, 10);
  const r = pick([2, 3]);
  const comb = r === 2 ? (n * (n - 1)) / 2 : (n * (n - 1) * (n - 2)) / 6;
  return mkNumEn(`From ${n} students, ${r} committee members are chosen (order does not matter). The number of ways to choose is …`, comb, [comb - n, n * (n - 1), comb + n], `Combination C(${n},${r}) = ${comb} ways.`);
};
const smaQuadraticEn: LGen = () => {
  const r1 = pick([-9, -7, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 8]);
  let r2 = pick([-8, -6, -4, -3, -2, -1, 1, 2, 3, 4, 5, 7, 9]);
  if (r2 === r1) r2 = r1 + 2;
  const sum = r1 + r2;
  const prod = r1 * r2;
  const bTerm = sum === 0 ? "" : sum > 0 ? ` − ${sum}x` : ` + ${-sum}x`;
  const cTerm = prod === 0 ? "" : prod > 0 ? ` + ${prod}` : ` − ${-prod}`;
  const eq = `x²${bTerm}${cTerm} = 0`;
  const mode = ri(0, 2);
  if (mode === 0) return mkNumEn(`The sum of the roots of the quadratic equation ${eq} is …`, sum, [sum - 2, sum + 2, prod], `The factors are (x − (${r1}))(x − (${r2})), the roots are ${r1} and ${r2}; their sum is ${r1} + ${r2} = ${sum}.`);
  if (mode === 1) return mkNumEn(`The product of the roots of the quadratic equation ${eq} is …`, prod, [prod - r1, prod + r2, sum], `The roots are ${r1} and ${r2}; their product is ${r1} × ${r2} = ${prod} (= c/a).`);
  return mkNumEn(`If ${r1} and ${r2} are the roots of a quadratic equation, then the value of (${r1})² + (${r2})² is …`, r1 * r1 + r2 * r2, [sum * sum, prod * 2, r1 * r1 + r2 * r2 + 2], `(${r1})² + (${r2})² = ${r1 * r1} + ${r2 * r2} = ${r1 * r1 + r2 * r2}.`);
};
const smaGeomSeriesEn: LGen = (level) => {
  const a = ri(1, 6);
  const r = pick([2, 3]);
  const n = ri(4, 7);
  const un = a * r ** (n - 1);
  if (level >= 4 && Math.random() < 0.5) {
    const sn = (a * (r ** n - 1)) / (r - 1);
    return mkNumEn(`The sum of the first ${n} terms of the geometric series ${a}, ${a * r}, ${a * r * r}, … is …`, sn, [sn - un, un * n, sn + a], `Sn = a(rⁿ−1)/(r−1) = ${a}×(${r ** n}−1)/${r - 1} = ${enFmt(sn)}.`);
  }
  return mkNumEn(`The ${n}th term of the geometric sequence ${a}, ${a * r}, ${a * r * r}, … is …`, un, [a * r ** (n - 2), un + a, un * r], `Un = a·rⁿ⁻¹ = ${a}×${r}^${n - 1} = ${enFmt(un)}.`);
};
const smaDetEn: LGen = (level) => {
  if (level < 2) return null;
  const a = ri(1, 6); const b = ri(1, 6); const c = ri(1, 6); const d = ri(1, 6);
  const det = a * d - b * c;
  return mkNumEn(`The determinant of the matrix [[${a}, ${b}], [${c}, ${d}]] is …`, det, [a * d + b * c, det + b, det - c], `det = ${a}×${d} − ${b}×${c} = ${a * d} − ${b * c} = ${det}.`);
};
const smaPermEn: LGen = (level) => {
  if (level < 3) return null;
  if (Math.random() < 0.5) {
    const n = ri(4, 7);
    let f = 1; for (let i = 2; i <= n; i++) f *= i;
    return mkNumEn(`The value of ${n}! (factorial) is …`, f, [f / 2, f + n, f * 2], `${n}! = ${Array.from({ length: n }, (_, i) => i + 1).join(" × ")} = ${enFmt(f)}.`);
  }
  const n = ri(5, 9);
  const r = pick([2, 3]);
  let p = 1; for (let i = 0; i < r; i++) p *= n - i;
  return mkNumEn(`The number of arrangements (permutations) of ${r} people from ${n} available people is …`, p, [p / (n - r + 1) * r, p + n, p - n], `P(${n},${r}) = ${Array.from({ length: r }, (_, i) => n - i).join(" × ")} = ${enFmt(p)}.`);
};
const smaPhysicsEn: LGen = (level) => {
  const kind = ri(0, 3);
  if (kind === 0) {
    const v0 = ri(2, 15);
    const a = ri(1, 4);
    const t = ri(2, 6);
    return mkNumEn(`A car moves with an initial velocity of ${v0} m/s and an acceleration of ${a} m/s² for ${t} s. Its final velocity is … m/s`, v0 + a * t, [v0 + a * t - a, v0 * a, v0 + t], `v = v₀ + at = ${v0} + ${a}×${t} = ${v0 + a * t} m/s.`);
  }
  if (kind === 1) {
    const m = pick([1, 2, 4, 5]);
    const v = ri(3, 6 + level);
    return mkNumEn(`The kinetic energy of an object of mass ${m} kg moving at ${v} m/s is … J`, 0.5 * m * v * v, [m * v, 0.5 * m * v, m * v * v], `Ek = ½mv² = ½×${m}×${v}² = ${0.5 * m * v * v} J.`);
  }
  if (kind === 2) {
    const r1 = pick([2, 3, 4, 6]);
    const r2 = pick([2, 3, 6]);
    if (r1 === r2) return smaPhysicsEn(level);
    const rp = (r1 * r2) / (r1 + r2);
    if (!Number.isInteger(rp)) return smaPhysicsEn(level);
    return mkNumEn(`Resistors of ${r1} Ω and ${r2} Ω are connected in parallel. Their equivalent resistance is … Ω`, rp, [r1 + r2, rp + 1, Math.max(1, rp - 1)], `1/R = 1/${r1} + 1/${r2} → R = ${rp} Ω.`);
  }
  const lam = ri(2, 8);
  const f = ri(5, 40) * 10;
  return mkNumEn(`A wave with wavelength ${lam} m and frequency ${f} Hz has a wave speed of … m/s`, lam * f, [lam + f, lam * f / 2, f], `v = λ × f = ${lam} × ${f} = ${lam * f} m/s.`);
};
const smaChemistryPhEn: LGen = (level) => {
  if (level < 2) return null;
  const n = ri(1, Math.min(6, level + 2));
  if (Math.random() < 0.5) return mkNumEn(`The pH of a 10⁻${n} M HCl solution (0.${"0".repeat(Math.max(0, n - 1))}1 M) is …`, n, [n + 1, n === 1 ? n + 2 : n - 1, 14 - n], `HCl is a strong acid: [H⁺] = 10⁻${n} → pH = ${n}.`);
  return mkNumEn(`The pH of a 10⁻${n} M NaOH solution is …`, 14 - n, [n, 14 - n - 1, 14 - n + 1], `NaOH is a strong base: pOH = ${n}, pH = 14 − ${n} = ${14 - n}.`);
};
const smaGeneticsEn: LGen = (level) => {
  if (level < 2) return null;
  const crosses: readonly (readonly [string, string, string])[] = [
    ["Aa × Aa", "3 : 1", "A monohybrid cross between two heterozygotes produces a dominant : recessive phenotype ratio of 3 : 1."],
    ["Aa × aa", "1 : 1", "A test cross Aa × aa produces a dominant : recessive phenotype ratio of 1 : 1."],
    ["AA × aa", "All dominant (100%)", "All offspring have genotype Aa, so all show the dominant phenotype."],
    ["Aa × Aa (genotype)", "1 AA : 2 Aa : 1 aa", "The genotype ratio of a monohybrid Aa × Aa cross is 1 : 2 : 1."],
  ];
  const c = pick(crosses);
  const others = crosses.filter((x) => x[1] !== c[1]).map((x) => x[1]);
  return mkq(`A monohybrid cross ${c[0]} produces a ${c[0].includes("genotype") ? "genotype" : "dominant : recessive phenotype"} ratio of …`, c[1], sample(others, 3), c[2]);
};
const camMathEn: LGen = (level) => {
  const kind = ri(0, 2);
  if (kind === 0) {
    const a = ri(3, 9 + level * 2);
    const b = ri(3, 12);
    return mkNumEn(`What is ${a} × ${b}?`, a * b, [a * b - a, a * b + b, a * b + 10], `${a} × ${b} = ${a * b}.`);
  }
  if (kind === 1) {
    const pct = pick([10, 20, 25, 50, 75]);
    const base = pick([100, 200, 240, 400, 80, 120]);
    const v = (pct * base) / 100;
    return mkNumEn(`What is ${pct}% of ${base}?`, v, [v + 5, v - 5, v * 2], `${pct}% × ${base} = ${v}.`);
  }
  const start = ri(2, 15);
  const diff = ri(2, 3 + level);
  const seq = [0, 1, 2, 3].map((i) => start + i * diff);
  const ans = start + 4 * diff;
  return mkNumEn(`Next in the sequence: ${seq.join(", ")}, …`, ans, [ans - diff, ans + diff, ans + 1], `Each term increases by ${diff}: ${seq[3]} + ${diff} = ${ans}.`);
};
const smaTraceEn: LGen = () => {
  const kind = ri(0, 3);
  if (kind === 0) {
    const a = ri(2, 20), b = ri(2, 20);
    const ans = a + b;
    return mkNumEn(`Look at this program:\nx = ${a}\ny = ${b}\nx = x + y\nprint x\nThe value printed is …`, ans, [ans + 1, ans - 1, a * b], `The final x = ${a} + ${b} = ${ans}.`);
  }
  if (kind === 1) {
    const n = ri(3, 8);
    const ans = (n * (n + 1)) / 2;
    return mkNumEn(`Look at this program:\ntotal = 0\nfor i from 1 to ${n}:\n    total = total + i\nprint total\nThe value printed is …`, ans, [ans + n, ans - 1, n * n], `total = 1+2+…+${n} = ${ans}.`);
  }
  if (kind === 2) {
    const n = ri(3, 9);
    const ans = 2 * n;
    return mkNumEn(`Look at this program:\ncount = 0\nfor i from 1 to ${n}:\n    count = count + 2\nprint count\nThe value printed is …`, ans, [ans + 2, n, ans - 2], `The loop runs ${n} times, adding 2 each time → ${ans}.`);
  }
  const words = ["computer", "informatics", "algorithm", "internet", "program", "data", "cyber", "network"] as const;
  const w = pick(words);
  return mkNumEn(`In a program, word = "${w}". The value of length(word) is …`, w.length, [w.length + 1, w.length - 1, w.length + 2], `"${w}" has ${w.length} letters.`);
};

/* ---------- pembangun set per jenjang (Bahasa Inggris) ---------- */
function tikGensEn(jenjang: JenjangId): LGen[] {
  if (jenjang === "TK") {
    return [
      pairGenL({ pairs: TK_KOMPUTER_PAIRS_EN, askA: (a) => `A ${a.toLowerCase()} is used for …`, askB: (b) => `The tool used for “${b.charAt(0).toLowerCase() + b.slice(1)}” is the …`, exA: (a, b) => `${a}: ${b.charAt(0).toLowerCase() + b.slice(1)}.`, exB: (a, _b) => `That is the ${a.toLowerCase()}.`, four: false }),
      factGenL(TK_KOMPUTER_FACTS_EN, false),
    ];
  }
  if (jenjang === "SD") {
    return [
      classifyGenL(INF_CLASSIFY_EN.map((x) => ({ item: x.item, cat: x.cat })), (i) => `${i} belongs to the group of …`, (i, c) => `${i} is a ${c.charAt(0).toLowerCase() + c.slice(1)}.`),
      classifyGenL(IO_CLASSIFY_EN.map((x) => ({ item: x.item, cat: x.cat })), (i) => `${i} belongs to the group of …`, (i, c) => `${i} is a ${c.charAt(0).toLowerCase() + c.slice(1)}.`),
      pairGenL({ pairs: SD_TIK_PAIRS_EN, askA: (a) => `A ${a.toLowerCase()} functions to …`, askB: (b) => `The device that functions to “${b.charAt(0).toLowerCase() + b.slice(1)}” is the …`, exA: (a, b) => `${a}: ${b.charAt(0).toLowerCase() + b.slice(1)}.`, exB: (a, _b) => `That is the ${a.toLowerCase()}.` }),
      factGenL(SD_TIK_FACTS_EN),
      factGenL(SD_TIK_FACTS2_EN),
    ];
  }
  if (jenjang === "SMP") {
    return [
      pairGenL({ pairs: FLOW_PAIRS_EN, askA: (a) => `In a flowchart, the ${a.toLowerCase()} symbol means …`, askB: (b) => `“${b}” in a flowchart is symbolised by a …`, exA: (a, b) => `${a}: ${b.charAt(0).toLowerCase() + b.slice(1)}.`, exB: (a, _b) => `That is the ${a.toLowerCase()} symbol.` }),
      pairGenL({ pairs: MALWARE_PAIRS_EN, askA: (a) => `The malicious software “${a}” is …`, askB: (b) => `“${b}” — that is a trait of …`, exA: (a, b) => `${a}: ${b.charAt(0).toLowerCase() + b.slice(1)}.`, exB: (a, _b) => `That is ${a}.` }),
      pairGenL({ pairs: SHORTCUT_PAIRS_EN, askA: (a) => `The keyboard shortcut ${a} functions to …`, askB: (b) => `To “${b.charAt(0).toLowerCase() + b.slice(1)}”, press …`, exA: (a, b) => `${a}: ${b.charAt(0).toLowerCase() + b.slice(1)}.`, exB: (a, _b) => `Press ${a}.` }),
      pairGenL({ pairs: JARINGAN_PAIRS_EN, askA: (a) => `A ${a.toLowerCase()} in a computer network functions to …`, askB: (b) => `“${b}” — that is a …`, exA: (a, b) => `${a}: ${b.charAt(0).toLowerCase() + b.slice(1)}.`, exB: (a, _b) => `That is a ${a.toLowerCase()}.` }),
      factGenL(SMP_TIK_FACTS_EN),
      factGenL(SMP_TIK_FACTS2_EN),
    ];
  }
  return [
    pairGenL({ pairs: MALWARE_PAIRS_EN, askA: (a) => `The malicious software “${a}” is …`, askB: (b) => `“${b}” — that is a trait of …`, exA: (a, b) => `${a}: ${b.charAt(0).toLowerCase() + b.slice(1)}.`, exB: (a, _b) => `That is ${a}.` }),
    pairGenL({ pairs: PROTOKOL_PAIRS_EN, askA: (a) => `The ${a} protocol functions to …`, askB: (b) => `“${b}” is the function of the … protocol`, exA: (a, b) => `${a}: ${b.charAt(0).toLowerCase() + b.slice(1)}.`, exB: (a, _b) => `That is the ${a} protocol.` }),
    pairGenL({ pairs: SHORTCUT_PAIRS_EN, askA: (a) => `The keyboard shortcut ${a} functions to …`, askB: (b) => `To “${b.charAt(0).toLowerCase() + b.slice(1)}”, press …`, exA: (a, b) => `${a}: ${b.charAt(0).toLowerCase() + b.slice(1)}.`, exB: (a, _b) => `Press ${a}.` }),
    smaTraceEn,
    factGenL(SMA_TIK_FACTS_EN),
    factGenL(SMA_TIK_FACTS2_EN),
  ];
}
function sejarahGensEn(jenjang: JenjangId): LGen[] {
  if (jenjang === "TK") return [
    pairGenL({ pairs: TK_SEJ_PAIRS_EN, askA: (a) => `${a} is …`, askB: (b) => `“${b}” — that is …`, exA: (a, b) => `${a}: ${b.charAt(0).toLowerCase() + b.slice(1)}.`, exB: (a, _b) => `That is ${a}.`, four: false }),
    factGenL(TK_SEJ_FACTS_EN, false),
  ];
  const base: LGen[] = [
    pairGenL({ pairs: KERAJAAN_EN, askA: (a) => `The kingdom of ${a} is known for …`, askB: (b) => `“${b}” is a trait of the kingdom of …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `That is the kingdom of ${a}.` }),
    pairGenL({ pairs: PAHLAWAN_EN, askA: (a) => `The hero ${a} came from …`, askB: (b) => `The hero who came from ${b} is …`, exA: (a, b) => `${a} came from ${b}.`, exB: (a, b) => `From ${b}: ${a}.` }),
    pairGenL({ pairs: PERISTIWA_ID_EN, askA: (a) => `${a} happened on / in …`, askB: (b) => `The event that happened on / in ${b.charAt(0).toLowerCase() + b.slice(1)} is …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `On / in ${b}: ${a}.` }),
    factGenL(SEJ_SD_FACTS_EN),
  ];
  if (jenjang === "SD") return base;
  const mid: LGen[] = [
    ...base,
    pairGenL({ pairs: PERISTIWA_DUNIA_EN, askA: (a) => `${a} happened on / in …`, askB: (b) => `The world event that happened on / in ${b.charAt(0).toLowerCase() + b.slice(1)} is …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `On / in ${b}: ${a}.` }),
    factGenL(SEJ_SMP_FACTS_EN),
  ];
  if (jenjang === "SMP") return mid;
  return [...mid, factGenL(SEJ_SMA_FACTS_EN)];
}
const KOREA_VOCAB_EN: readonly (readonly [string, string])[] = [
  ["hello / hi", "안녕하세요 (annyeonghaseyo)"],
  ["thank you", "감사합니다 (gamsahamnida)"],
  ["goodbye (to the one leaving)", "안녕히 가세요 (annyeonghi gaseyo)"],
  ["yes", "네 (ne)"],
  ["no", "아니요 (aniyo)"],
  ["one (Sino: il)", "일 (il)"],
  ["two (Sino: i)", "이 (i)"],
  ["three (Sino: sam)", "삼 (sam)"],
  ["four (Sino: sa)", "사 (sa)"],
  ["five (Sino: o)", "오 (o)"],
  ["six (Sino: yuk)", "육 (yuk)"],
  ["seven (Sino: chil)", "칠 (chil)"],
  ["eight (Sino: pal)", "팔 (pal)"],
  ["nine (Sino: gu)", "구 (gu)"],
  ["ten (Sino: sip)", "십 (sip)"],
  ["one (native: hana)", "하나 (hana)"],
  ["two (native: dul)", "둘 (dul)"],
  ["three (native: set)", "셋 (set)"],
  ["water", "물 (mul)"],
  ["rice / food", "밥 (bap)"],
  ["school", "학교 (hakgyo)"],
  ["book", "책 (chaek)"],
  ["friend", "친구 (chingu)"],
  ["mother", "엄마 (eomma)"],
  ["father", "아빠 (appa)"],
  ["cat", "고양이 (goyangi)"],
  ["dog", "강아지 (gangaji)"],
  ["apple", "사과 (sagwa)"],
  ["milk", "우유 (uyu)"],
  ["red", "빨간색 (ppalgansaek)"],
  ["blue", "파란색 (paransaek)"],
  ["yellow", "노란색 (noransaek)"],
  ["today", "오늘 (oneul)"],
  ["tomorrow", "내일 (naeil)"],
  ["yesterday", "어제 (eoje)"],
  ["I / me", "저 (jeo) / 나 (na)"],
  ["happy", "행복해요 (haengbokhaeyo)"],
  ["love", "사랑 (sarang)"],
  ["teacher", "선생님 (seonsaengnim)"],
  ["student", "학생 (haksaeng)"],
  ["house", "집 (jip)"],
  ["car", "자동차 (jadongcha)"],
  ["sun", "태양 (taeyang)"],
  ["moon", "달 (dal)"],
  ["star", "별 (byeol)"],
  ["sea", "바다 (bada)"],
  ["mountain", "산 (san)"],
];
const JEPANG_VOCAB_EN: readonly (readonly [string, string])[] = [
  ["good morning", "おはよう (ohayou)"],
  ["hello / good afternoon", "こんにちは (konnichiwa)"],
  ["good evening", "こんばんは (konbanwa)"],
  ["thank you", "ありがとう (arigatou)"],
  ["thank you very much (polite)", "ありがとうございます (arigatou gozaimasu)"],
  ["excuse me / sorry", "すみません (sumimasen)"],
  ["goodbye", "さようなら (sayounara)"],
  ["one", "一 (ichi)"],
  ["two", "二 (ni)"],
  ["three", "三 (san)"],
  ["four", "四 (yon / shi)"],
  ["five", "五 (go)"],
  ["six", "六 (roku)"],
  ["seven", "七 (nana / shichi)"],
  ["eight", "八 (hachi)"],
  ["nine", "九 (kyuu)"],
  ["ten", "十 (juu)"],
  ["water", "水 (mizu)"],
  ["school", "学校 (gakkou)"],
  ["book", "本 (hon)"],
  ["friend", "友達 (tomodachi)"],
  ["mother", "母 (haha) / お母さん (okaasan)"],
  ["father", "父 (chichi) / お父さん (otousan)"],
  ["cat", "猫 (neko)"],
  ["dog", "犬 (inu)"],
  ["fish", "魚 (sakana)"],
  ["apple", "りんご (ringo)"],
  ["milk", "牛乳 (gyuunyuu)"],
  ["red", "赤 (aka)"],
  ["blue", "青 (ao)"],
  ["white", "白 (shiro)"],
  ["black", "黒 (kuro)"],
  ["today", "今日 (kyou)"],
  ["tomorrow", "明日 (ashita)"],
  ["yesterday", "昨日 (kinou)"],
  ["I / me", "私 (watashi)"],
  ["teacher", "先生 (sensei)"],
  ["student", "学生 (gakusei)"],
  ["house", "家 (ie)"],
  ["car", "車 (kuruma)"],
  ["sun", "太陽 (taiyou)"],
  ["moon", "月 (tsuki)"],
  ["mountain", "山 (yama)"],
  ["sea / ocean", "海 (umi)"],
  ["rain", "雨 (ame)"],
  ["snow", "雪 (yuki)"],
];
const MANDARIN_VOCAB_EN: readonly (readonly [string, string])[] = [
  ["hello", "你好 (nǐ hǎo)"],
  ["thank you", "谢谢 (xièxie)"],
  ["good morning", "早上好 (zǎoshang hǎo)"],
  ["goodbye / see you again", "再见 (zàijiàn)"],
  ["yes / correct", "是 (shì)"],
  ["no / not", "不 (bù)"],
  ["one", "一 (yī)"],
  ["two", "二 (èr)"],
  ["three", "三 (sān)"],
  ["four", "四 (sì)"],
  ["five", "五 (wǔ)"],
  ["six", "六 (liù)"],
  ["seven", "七 (qī)"],
  ["eight", "八 (bā)"],
  ["nine", "九 (jiǔ)"],
  ["ten", "十 (shí)"],
  ["one hundred", "百 (bǎi)"],
  ["water", "水 (shuǐ)"],
  ["rice (cooked)", "饭 (fàn)"],
  ["school", "学校 (xuéxiào)"],
  ["book", "书 (shū)"],
  ["friend", "朋友 (péngyou)"],
  ["mother", "妈妈 (māma)"],
  ["father", "爸爸 (bàba)"],
  ["cat", "猫 (māo)"],
  ["dog", "狗 (gǒu)"],
  ["fish", "鱼 (yú)"],
  ["apple", "苹果 (píngguǒ)"],
  ["red", "红色 (hóngsè)"],
  ["blue", "蓝色 (lánsè)"],
  ["yellow", "黄色 (huángsè)"],
  ["white", "白色 (báisè)"],
  ["today", "今天 (jīntiān)"],
  ["tomorrow", "明天 (míngtiān)"],
  ["yesterday", "昨天 (zuótiān)"],
  ["I / me", "我 (wǒ)"],
  ["you", "你 (nǐ)"],
  ["he (male)", "他 (tā)"],
  ["teacher", "老师 (lǎoshī)"],
  ["student", "学生 (xuésheng)"],
  ["house", "家 (jiā)"],
  ["sun", "太阳 (tàiyáng)"],
  ["moon", "月亮 (yuèliang)"],
  ["mountain", "山 (shān)"],
  ["sea", "海 (hǎi)"],
  ["love / like", "爱 (ài)"],
  ["happy / glad", "高兴 (gāoxìng)"],
];

/* ================= BAHASA ASING (Bahasa Inggris) ================= */
const KOREA_FACTS_EN: Fact[] = [
  ["The subject marker particle in Korean is …", "이/가 (i/ga)", ["을/를 (eul/reul)", "은/는 (eun/neun)", "에서 (eseo)"], "이/가 marks the subject; 을/를 marks the object; 은/는 marks the topic."],
  ["The object marker particle in Korean is …", "을/를 (eul/reul)", ["이/가 (i/ga)", "도 (do)", "와/과 (wa/gwa)"], "The object is marked 을 (after a consonant) / 를 (after a vowel)."],
  ["The formal polite sentence ending in Korean is …", "입니다 / -ㅂ니다 (imnida)", ["-아/어 (a/eo)", "-다 (da)", "-지 (ji)"], "The formal polite style uses the endings -입니다 and -ㅂ니다/습니다."],
  ["“저는 학생입니다” means …", "I am a student", ["I go to school", "He is my teacher", "We are all students"], "저는 = I (topic), 학생 = student, 입니다 = am/is/are."],
  ["The word “왜” in Korean means …", "Why", ["When", "Where", "Who"], "왜 (wae) = why; 언제 = when; 어디 = where; 누구 = who."],
  ["The question word “어디 (eodi)” means …", "Where", ["When", "How much", "What"], "어디 = where; 언제 = when; 얼마 = how much (price); 뭐 = what."],
  ["The basic word order of a Korean sentence is …", "Subject – Object – Verb (SOV)", ["Subject – Verb – Object (SVO)", "Verb – Subject – Object (VSO)", "Object – Verb – Subject (OVS)"], "Korean is SOV: the verb always comes at the end of the sentence."],
  ["“학교에 가요” means …", "Go to school", ["Come from school", "Study at home", "Read a school book"], "학교 = school, 에 = to (direction particle), 가요 = go."],
  ["Hangul was created during the reign of King …", "King Sejong the Great", ["King Gwanggaeto", "King Taejo", "King Jeongjo"], "King Sejong created Hangul (Hunminjeongeum) in the 15th century (1443/1446)."],
  ["The number of basic Hangul letters is …", "24 letters (14 consonants + 10 vowels)", ["26 letters", "21 letters", "40 letters"], "Basic Hangul: 14 basic consonants and 10 basic vowels."],
];
const JEPANG_FACTS_EN: Fact[] = [
  ["The topic marker particle in Japanese is …", "は (read 'wa')", ["を (wo)", "に (ni)", "が (ga) for everything"], "The topic is marked by the particle は, written 'ha' but read 'wa'."],
  ["“わたしは学生です” (watashi wa gakusei desu) means …", "I am a student", ["I go to school", "He is not a student", "We are all teachers"], "わたし = I, は = topic particle, 学生 = student, です = am/is/are (polite)."],
  ["The object marker particle in Japanese is …", "を (read 'o')", ["は (wa)", "へ (e)", "と (to)"], "The object is marked を; は topic; へ direction; と 'and/with'."],
  ["The polite (masu) form of the verb 'to eat' (食べる taberu) is …", "食べます (tabemasu)", ["食べた (tabeta)", "食べない (tabenai)", "食べたい (tabetai)"], "The -masu form is the polite present/future form."],
  ["The word “せんせい” (sensei) is used to address a …", "Teacher / respected expert", ["Classmate", "Younger student", "Stranger on the street"], "Sensei is used for teachers, doctors, and respected experts."],
  ["“ありがとう” is said when …", "Thanking someone", ["Apologising", "Saying goodbye", "Asking for help"], "ありがとう (arigatou) = thank you."],
  ["The Japanese script used for foreign loanwords is …", "Katakana", ["Hiragana", "Kanji", "Romaji"], "Katakana is used for foreign words, foreign names, and emphasis."],
  ["The kanji “山” is read 'yama' and means …", "Mountain", ["River", "Sea", "Forest"], "山 = mountain (yama / san). 川 = river, 海 = sea, 森 = forest."],
];
const MANDARIN_FACTS_EN: Fact[] = [
  ["Mandarin has … basic tones that change the meaning of words", "4 tones", ["2 tones", "6 tones", "No tones"], "Mandarin has 4 tones: high flat, rising, falling-rising, and falling. Example: mā (mother), má (hemp), mǎ (horse), mà (to scold)."],
  ["“我是学生” (Wǒ shì xuésheng) means …", "I am a student", ["I go to school", "He is a teacher", "We are all friends"], "我 = I, 是 = am/is/are, 学生 = student."],
  ["The word “吗 (ma)” at the end of a sentence functions to …", "Make a yes/no question", ["Mark the past", "Make a command sentence", "Show possession"], "吗 (ma) at the end of a statement turns it into a yes/no question."],
  ["The particle “的 (de)” in “我的书” shows …", "Possession (my book)", ["A question", "The future", "A prohibition"], "的 (de) marks possession: 我的书 = my book."],
  ["The common measure word for books in Mandarin is …", "本 (běn)", ["个 (gè)", "只 (zhī)", "条 (tiáo)"], "Books use the measure word 本; 个 is general; 只 is for animals; 条 is for long objects."],
  ["“你好吗?” (Nǐ hǎo ma?) means …", "How are you?", ["What is your name?", "Do you want to go?", "How much does it cost?"], "你好 = hello, 吗 = question particle → 'How are you?'"],
  ["The basic word order of a Mandarin sentence is …", "Subject – Verb – Object (SVO)", ["Subject – Object – Verb (SOV)", "Verb – Object – Subject (VOS)", "Object – Subject – Verb (OSV)"], "Mandarin is SVO, like Indonesian: 我吃饭 (I eat rice)."],
  ["The character “人 (rén)” means …", "Person / human", ["Mountain", "Water", "Mouth"], "人 = person. 山 = mountain, 水 = water, 口 = mouth."],
];
const JEPANG_KANA_EN: readonly (readonly [string, string])[] = [
  ["a", "あ"], ["i", "い"], ["u", "う"], ["e", "え"], ["o", "お"], ["ka", "か"], ["ki", "き"], ["ku", "く"],
  ["ke", "け"], ["ko", "こ"], ["sa", "さ"], ["shi", "し"], ["su", "す"], ["se", "せ"], ["so", "そ"],
  ["ta", "た"], ["chi", "ち"], ["tsu", "つ"], ["te", "て"], ["to", "と"], ["na", "な"], ["ni", "に"],
  ["nu", "ぬ"], ["ne", "ね"], ["no", "の"], ["ha", "は"], ["hi", "ひ"], ["fu", "ふ"], ["he", "へ"], ["ho", "ほ"],
  ["ma", "ま"], ["mi", "み"], ["mu", "む"], ["me", "め"], ["mo", "も"], ["ya", "や"], ["yu", "ゆ"], ["yo", "よ"],
  ["ra", "ら"], ["ri", "り"], ["ru", "る"], ["re", "れ"], ["ro", "ろ"], ["wa", "わ"], ["wo", "を"], ["n", "ん"],
];

/** Generator kosakata bahasa asing versi Inggris: jendela level sama
    seperti langVocabGensL (TK 20 / SD 34 / lainnya penuh). */
export function langVocabGensEn(
  vocab: readonly (readonly [string, string])[],
  langName: string,
  jenjang: JenjangId,
  extraFacts: readonly Fact[] = [],
): LGen[] {
  const limit = jenjang === "TK" ? 20 : jenjang === "SD" ? 34 : vocab.length;
  const slice = vocab.slice(0, limit);
  const gens: LGen[] = [
    pairGenL({
      pairs: slice,
      askA: (a) => `In ${langName}, “${a}” is …`,
      askB: (b) => `“${b}” in ${langName} means …`,
      exA: (a, b) => `“${a}” in ${langName} is ${b}.`,
      exB: (a, b) => `${b} means “${a}”.`,
      four: jenjang !== "TK",
    }),
  ];
  if (extraFacts.length && jenjang !== "TK") gens.push(factGenL(extraFacts));
  return gens;
}
const engVocabGensEn = (jenjang: JenjangId): LGen[] => {
  const gens: LGen[] = [
    pairGenL({
      pairs: EN_VOCAB_EN,
      askA: (a) => `What does “${a}” mean?`,
      askB: (b) => `Which English word means “${b}”?`,
      exA: (a, b) => `“${a}” means ${b}.`,
      exB: (a, b) => `“${b}” in English is “${a}”.`,
      four: jenjang !== "TK",
    }),
  ];
  if (jenjang !== "TK") {
    gens.push(
      pairGenL({ pairs: EN_OPPOSITES_EN, askA: (a) => `The opposite of “${a}” is …`, askB: (b) => `The word opposite in meaning to “${b}” is …`, exA: (a, b) => `${a} >< ${b}.`, exB: (a, b) => `The opposite of ${b} is ${a}.` }),
      pairGenL({ pairs: EN_PLURALS_EN, askA: (a) => `The plural of “${a}” is …`, askB: (b) => `The singular form of “${b}” is …`, exA: (a, b) => `${a} → ${b}.`, exB: (a, b) => `${b} is the plural of ${a}.` }),
    );
  }
  if (jenjang === "SMA") {
    gens.push(factGenL([
      ["“Had I known about the traffic, I ___ earlier.”", "would have left", ["will leave", "would leave", "leave"], "Third conditional (inverted 'Had I…'): would have + V3."],
      ["Choose the sentence with the correct subjunctive:", "I suggest that he go now.", ["I suggest that he goes now.", "I suggest that he going now.", "I suggest that he went now yesterday."], "After 'suggest that…', use the base form of the verb: go."],
      ["The phrase “break the ice” in a meeting means …", "To start a conversation and ease awkwardness", ["To end the meeting", "To cool the room", "To postpone discussion"], "An idiom: to ease the atmosphere / start a conversation so it is not awkward."],
      ["“The committee ___ reached its decision.” (formal British English)", "has", ["have", "are", "were"], "A collective noun treated as one unit → has."],
    ] as Fact[]));
    gens.push(pairGenL({ pairs: EN_PAST_EN, askA: (a) => `The past tense check — the past tense of “${a}” is …`, askB: (b) => `“${b}” is the past form of …`, exA: (a, b) => `${a} → ${b}.`, exB: (a, b) => `${b} ← ${a}.` }));
  } else if (jenjang === "SMP") {
    gens.push(
      pairGenL({ pairs: EN_PAST_EN, askA: (a) => `The past tense (V2) of “${a}” is …`, askB: (b) => `“${b}” is the past tense of …`, exA: (a, b) => `${a} → ${b}.`, exB: (a, b) => `${b} ← ${a}.` }),
      factGenL([
        ["“The report ___ by the students yesterday.” Choose the correct passive form!", "was written", ["writes", "wrote", "is writing"], "Passive past: was/were + V3 (written)."],
        ["She has lived in Bandung ___ 2019.", "since", ["for", "from", "until"], "Present perfect + a point in time uses 'since'."],
        ["Direct: “I am busy,” he said. → He said that …", "he was busy", ["he is busy", "I was busy", "he busy"], "Reported speech: am → was, I → he."],
        ["The synonym of “rapid” is …", "fast", ["slow", "weak", "late"], "Rapid = fast."],
        ["“Despite the rain, the match continued.” The word “despite” shows …", "contrast / concession", ["cause", "time", "purpose"], "Despite = although → concession."],
      ] as Fact[]),
    );
  }
  return gens;
};

/* ================= REGISTRY GENERATOR — Bahasa Inggris ================= */
export const GENERATORS_EN: Partial<Record<JenjangId, Record<string, LGen[]>>> = {
  TK: {
    inggris: [tkEngPairsEn, tkEngArrangeEn, tkCompareEn],
    matematika: [tkCountEn, tkAddSubEn, tkCompareEn, tkMissingEn, tkBeforeAfterEn, tkStoryCountEn, factGenL(TK_SHAPE_FACTS_EN, false)],
    sains: [pairGenL({ pairs: TK_SAINS_PAIRS_EN, askA: (a) => `${a} mainly lives in …`, askB: (b) => `The animal that lives in ${b.charAt(0).toLowerCase() + b.slice(1)} is the …`, exA: (a, b) => `${a} lives in ${b.charAt(0).toLowerCase() + b.slice(1)}.`, exB: (a, b) => `The one that lives in ${b.charAt(0).toLowerCase() + b.slice(1)} is the ${a.toLowerCase()}.`, four: false }), factGenL(TK_SAINS_FACTS_EN, false)],
    informatika: tikGensEn("TK"),
    sejarah: sejarahGensEn("TK"),
    korea: langVocabGensEn(KOREA_VOCAB_EN, "Korean", "TK"),
    jepang: [...langVocabGensEn(JEPANG_VOCAB_EN, "Japanese", "TK"), pairGenL({ pairs: JEPANG_KANA_EN.slice(0, 15), askA: (a) => `The hiragana for the sound “${a}” is …`, askB: (b) => `The hiragana “${b}” is read …`, exA: (a, b) => `The sound “${a}” is written ${b}.`, exB: (a, b) => `${b} is read “${a}”.`, four: false })],
    mandarin: langVocabGensEn(MANDARIN_VOCAB_EN, "Mandarin", "TK"),
  },
  SD: {
    matematika: [sdAddSubEn, sdMulDivEn, sdMixedEn, sdFractionEn, sdFpbKpkEn, sdGeometryEn, sdAverageEn, sdSequenceEn, sdWordProblemEn, sdRoundEn, sdPercentEn, sdClockEn, sdUnitEn, sdFracCompareEn,
      pairGenL({ pairs: ROMAN_PAIRS_EN, askA: (a) => `The Roman numeral for ${a} is …`, askB: (b) => `The Roman numeral “${b}” has the value …`, exA: (a, b) => `${a} in Roman numerals is ${b}.`, exB: (a, b) => `${b} has the value ${a}.` })],
    inggris: [...engVocabGensEn("SD"), sdEngPastEn],
    sains: [
      pairGenL({ pairs: SD_SAINS_PAIRS_EN, askA: (a) => `The function of the ${a.toLowerCase()} is to …`, askB: (b) => `The part/organ that functions to “${b.charAt(0).toLowerCase() + b.slice(1)}” is the …`, exA: (a, b) => `${a}: ${b.charAt(0).toLowerCase() + b.slice(1)}.`, exB: (a, b) => `The one that functions to ${b.charAt(0).toLowerCase() + b.slice(1)} is the ${a.toLowerCase()}.` }),
      factGenL(SD_SAINS_FACTS_EN), planetGenEn,
      classifyGenL(SD_SAINS_CLASSIFY_EN.map((x) => ({ item: x.item, cat: x.cat })), (i) => `The animal ${i.toLowerCase()} undergoes …`, (i, c) => `${i} has ${c.charAt(0).toLowerCase() + c.slice(1)}.`),
    ],
    ips: [
      pairGenL({ pairs: PROVINSI_EN, askA: (a) => `The capital of ${a} Province is …`, askB: (b) => `${b} is the capital of … Province`, exA: (a, b) => `The capital of ${a} is ${b}.`, exB: (a, b) => `${b} is the capital of ${a} Province.` }),
      pairGenL({ pairs: PAHLAWAN_EN, askA: (a) => `${a} is a hero who came from / fought in the region of …`, askB: (b) => `The hero from the region of ${b} is …`, exA: (a, b) => `${a} came from ${b}.`, exB: (a, b) => `From ${b}: ${a}.` }),
    ],
    informatika: tikGensEn("SD"),
    sejarah: sejarahGensEn("SD"),
    "cambridge-eng": [...engVocabGensEn("SD"),
      pairGenL({ pairs: EN_PAST_EN, askA: (a) => `The past tense of “${a}” is …`, askB: (b) => `The base form (V1) of “${b}” is …`, exA: (a, b) => `${a} → ${b}.`, exB: (a, b) => `${b} comes from ${a}.` })],
    "cambridge-sci": [
      pairGenL({ pairs: CAM_SCI_PAIRS_EN, askA: (a) => `In science, the ${a.toLowerCase()} …`, askB: (b) => `“${b}” — this describes the …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `That is the ${a}.` }),
      factGenL(SD_SAINS_FACTS_EN),
    ],
    "cambridge-math": [camMathEn],
    korea: langVocabGensEn(KOREA_VOCAB_EN, "Korean", "SD", KOREA_FACTS_EN),
    jepang: [...langVocabGensEn(JEPANG_VOCAB_EN, "Japanese", "SD", JEPANG_FACTS_EN), pairGenL({ pairs: JEPANG_KANA_EN, askA: (a) => `The hiragana for the sound “${a}” is …`, askB: (b) => `The hiragana “${b}” is read …`, exA: (a, b) => `The sound “${a}” is written ${b}.`, exB: (a, b) => `${b} is read “${a}”.` })],
    mandarin: langVocabGensEn(MANDARIN_VOCAB_EN, "Mandarin", "SD", MANDARIN_FACTS_EN),
  },
  SMP: {
    matematika: [smpNegOpsEn, smpEquationEn, smpSequenceEn, smpGradientEn, smpProbabilityEn, smpScaleEn, smpPhysicsEn, smpDiscountEn, smpProfitEn, smpPythagEn, smpCircleEn, smpVolumeEn, smpAnglesEn, smpTwoVarEn],
    inggris: engVocabGensEn("SMP"),
    sains: [factGenL(SMP_SAINS_FACTS_EN), smpPhysicsEn, phGenEn,
      pairGenL({ pairs: ORGANEL_EN, askA: (a) => `The function of the organelle ${a.toLowerCase()} is to …`, askB: (b) => `The organelle that functions to “${b.charAt(0).toLowerCase() + b.slice(1)}” is the …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `That is the ${a.toLowerCase()}.` })],
    ips: [
      pairGenL({ pairs: EVENT_YEAR_EN, askA: (a) => `${a} happened on / in …`, askB: (b) => `The event that happened on / in ${b} is …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `On / in ${b}: ${a}.` }),
      pairGenL({ pairs: SMP_IPS_PAIRS_EN, askA: (a) => `${a} is …`, askB: (b) => `“${b}” — that is …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `That is ${a}.` }),
      pairGenL({ pairs: PROVINSI_EN, askA: (a) => `The capital of ${a} Province is …`, askB: (b) => `${b} is the capital of … Province`, exA: (a, b) => `The capital of ${a} is ${b}.`, exB: (a, b) => `${b} is the capital of ${a} Province.` }),
    ],
    informatika: [binaryGenEn,
      classifyGenL(INF_CLASSIFY_EN.map((x) => ({ item: x.item, cat: x.cat })), (i) => `${i} belongs to the group of …`, (i, c) => `${i} is a ${c.charAt(0).toLowerCase() + c.slice(1)}.`),
      factGenL(SMP_INF_FACTS_EN), ...tikGensEn("SMP")],
    sejarah: sejarahGensEn("SMP"),
    "cambridge-eng": [
      pairGenL({ pairs: EN_PAST_EN, askA: (a) => `The past tense (V2) of “${a}” is …`, askB: (b) => `“${b}” is the past tense of …`, exA: (a, b) => `${a} → ${b}.`, exB: (a, b) => `${b} ← ${a}.` }),
      pairGenL({ pairs: EN_OPPOSITES_EN, askA: (a) => `The opposite of “${a}” is …`, askB: (b) => `The antonym of “${b}” is …`, exA: (a, b) => `${a} >< ${b}.`, exB: (a, b) => `The opposite of ${b} is ${a}.` }),
    ],
    "cambridge-sci": [
      pairGenL({ pairs: CAM_SCI_PAIRS_EN, askA: (a) => `In science, the ${a.toLowerCase()} …`, askB: (b) => `“${b}” — this describes the …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `That is the ${a}.` }),
      pairGenL({ pairs: UNSUR_EN, askA: (a) => `The chemical symbol for ${a.toLowerCase()} is …`, askB: (b) => `The symbol “${b}” stands for the element …`, exA: (a, b) => `${a} = ${b}.`, exB: (a, b) => `${b} = ${a}.` }),
    ],
    "cambridge-math": [camMathEn, smpEquationEn],
    korea: langVocabGensEn(KOREA_VOCAB_EN, "Korean", "SMP", KOREA_FACTS_EN),
    jepang: [...langVocabGensEn(JEPANG_VOCAB_EN, "Japanese", "SMP", JEPANG_FACTS_EN), pairGenL({ pairs: JEPANG_KANA_EN, askA: (a) => `The hiragana for the sound “${a}” is …`, askB: (b) => `The hiragana “${b}” is read …`, exA: (a, b) => `The sound “${a}” is written ${b}.`, exB: (a, b) => `${b} is read “${a}”.` })],
    mandarin: langVocabGensEn(MANDARIN_VOCAB_EN, "Mandarin", "SMP", MANDARIN_FACTS_EN),
  },
  SMA: {
    matematika: [smaDerivativeEn, smaLimitEn, smaLogEn, smaSeriesEn, smaCombinationEn, smaQuadraticEn, smaGeomSeriesEn, smaDetEn, smaPermEn, factGenL(TRIG_FACTS_EN)],
    inggris: engVocabGensEn("SMA"),
    biologi: [smaGeneticsEn,
      pairGenL({ pairs: ENZIM_EN, askA: (a) => `The enzyme ${a} functions to …`, askB: (b) => `The enzyme that functions to “${b.charAt(0).toLowerCase() + b.slice(1)}” is …`, exA: (a, b) => `${a}: ${b.charAt(0).toLowerCase() + b.slice(1)}.`, exB: (a, _b) => `That is the enzyme ${a}.` }),
      pairGenL({ pairs: ORGANEL_EN, askA: (a) => `The function of the organelle ${a.toLowerCase()} is to …`, askB: (b) => `The organelle that functions to “${b.charAt(0).toLowerCase() + b.slice(1)}” is the …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `That is the ${a.toLowerCase()}.` }),
      factGenL([
        ["In aerobic respiration, the stage that produces the most ATP is …", "The electron transport chain", ["Glycolysis", "The Krebs cycle", "Fermentation"], "The electron transport chain produces ±34 ATP."],
        ["The enzyme that joins Okazaki fragments in DNA replication is …", "DNA ligase", ["Helicase", "Primase", "Topoisomerase"], "DNA ligase joins Okazaki fragments on the lagging strand."],
        ["The respiratory organ of insects is the …", "Trachea", ["Lungs", "Gills", "Skin"], "Insects breathe through the tracheal system & spiracles."],
      ] as Fact[])],
    fisika: [smaPhysicsEn],
    kimia: [smaChemistryPhEn,
      pairGenL({ pairs: UNSUR_EN, askA: (a) => `The symbol of the element ${a.toLowerCase()} is …`, askB: (b) => `The element with the symbol “${b}” is …`, exA: (a, b) => `${a} = ${b}.`, exB: (a, b) => `${b} = ${a}.` }),
      factGenL([
        ["The electron configuration of Fe (Z = 26) is …", "[Ar] 4s² 3d⁶", ["[Ar] 4s¹ 3d⁷", "[Ar] 3d⁸", "[Ne] 4s² 3d⁶"], "Fe: 1s²2s²2p⁶3s²3p⁶4s²3d⁶ = [Ar] 4s² 3d⁶."],
        ["The oxidation number of S in H₂SO₄ is …", "+6", ["+2", "+4", "−2"], "2(+1) + S + 4(−2) = 0 → S = +6."],
        ["A buffer solution consists of …", "A weak acid + its conjugate base", ["A strong acid + a strong base", "Salt + water only", "A strong acid + its salt"], "Buffer: a weak acid + its conjugate base (or the reverse)."],
      ] as Fact[])],
    ips: [
      pairGenL({ pairs: EVENT_YEAR_EN, askA: (a) => `${a} happened on / in …`, askB: (b) => `The event that happened on / in ${b} is …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, b) => `On / in ${b}: ${a}.` }),
      pairGenL({ pairs: PROVINSI_EN, askA: (a) => `The capital of ${a} Province is …`, askB: (b) => `${b} is the capital of … Province`, exA: (a, b) => `The capital of ${a} is ${b}.`, exB: (a, b) => `${b} is the capital of ${a} Province.` }),
      pairGenL({ pairs: PAHLAWAN_EN, askA: (a) => `${a} is a hero who came from / fought in the region of …`, askB: (b) => `The hero from the region of ${b} is …`, exA: (a, b) => `${a} came from ${b}.`, exB: (a, b) => `From ${b}: ${a}.` }),
      factGenL([
        ["The laissez-faire economic theory (minimal government role) was proposed by …", "Adam Smith", ["Karl Marx", "John Maynard Keynes", "David Ricardo"], "Adam Smith, “The Wealth of Nations” (1776)."],
        ["World War II in the Pacific ended after the bombing of Hiroshima & Nagasaki in the year …", "1945", ["1943", "1944", "1946"], "August 1945; Japan surrendered, WWII ended."],
        ["One function of foreign exchange reserves for a country is to …", "Pay for imports and foreign debt", ["Print new money", "Lower inflation directly", "Pay civil servant salaries"], "Foreign exchange is used for foreign transactions."],
        ["The concept of “Dwifungsi ABRI” and strong political stability is a trait of the era of …", "The New Order", ["Liberal Democracy", "Guided Democracy", "Reformasi"], "The New Order (1966–1998)."],
      ] as Fact[])],
    informatika: [
      pairGenL({ pairs: OSI_EN, askA: (a) => `The OSI layer ${a} functions to …`, askB: (b) => `“${b}” is the function of the OSI layer …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `That is the function of ${a}.` }),
      pairGenL({ pairs: ATTACK_EN, askA: (a) => `The cyber attack “${a}” is …`, askB: (b) => `“${b}” — that is the attack called …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `That is ${a}.` }),
      binaryGenEn,
      factGenL(SMA_INF_FACTS_EN), ...tikGensEn("SMA")],
    sejarah: sejarahGensEn("SMA"),
    "cambridge-eng": [
      factGenL([
        ["Choose the correctly punctuated sentence:", "It's a shame that the team's losing.", ["Its a shame that the teams losing.", "Its a shame that the team's losing.", "It's a shame that the teams' losing."], "It's = it is; team's = possessive singular."],
        ["Which sentence uses the passive correctly?", "The bridge was built in 1990.", ["The bridge was build in 1990.", "The bridge is build in 1990.", "The bridge built was in 1990."], "Passive past: was + past participle (built)."],
        ["Choose the correct sentence in the present perfect:", "I have seen that film.", ["I have saw that film.", "I has seen that film.", "I have see that film."], "Present perfect: have + past participle (seen)."],
      ] as Fact[]),
      pairGenL({ pairs: EN_OPPOSITES_EN, askA: (a) => `The opposite of “${a}” is …`, askB: (b) => `The antonym of “${b}” is …`, exA: (a, b) => `${a} >< ${b}.`, exB: (a, b) => `The opposite of ${b} is ${a}.` }),
      pairGenL({ pairs: EN_PAST_EN, askA: (a) => `The past tense (V2) of “${a}” is …`, askB: (b) => `“${b}” is the past tense of …`, exA: (a, b) => `${a} → ${b}.`, exB: (a, b) => `${b} ← ${a}.` }),
      pairGenL({ pairs: EN_PLURALS_EN, askA: (a) => `The plural of “${a}” is …`, askB: (b) => `The singular form of “${b}” is …`, exA: (a, b) => `${a} → ${b}.`, exB: (a, b) => `${b} is the plural of ${a}.` }),
    ],
    "cambridge-sci": [
      pairGenL({ pairs: UNSUR_EN, askA: (a) => `The chemical symbol for ${a.toLowerCase()} is …`, askB: (b) => `The symbol “${b}” stands for the element …`, exA: (a, b) => `${a} = ${b}.`, exB: (a, b) => `${b} = ${a}.` }),
      pairGenL({ pairs: CAM_SCI_PAIRS_EN, askA: (a) => `In science, the ${a.toLowerCase()} …`, askB: (b) => `“${b}” — this describes the …`, exA: (a, b) => `${a}: ${b}.`, exB: (a, _b) => `That is the ${a}.` }),
      smaPhysicsEn,
    ],
    "cambridge-math": [camMathEn, smaSeriesEn],
    korea: langVocabGensEn(KOREA_VOCAB_EN, "Korean", "SMA", KOREA_FACTS_EN),
    jepang: [...langVocabGensEn(JEPANG_VOCAB_EN, "Japanese", "SMA", JEPANG_FACTS_EN), pairGenL({ pairs: JEPANG_KANA_EN, askA: (a) => `The hiragana for the sound “${a}” is …`, askB: (b) => `The hiragana “${b}” is read …`, exA: (a, b) => `The sound “${a}” is written ${b}.`, exB: (a, b) => `${b} is read “${a}”.` })],
    mandarin: langVocabGensEn(MANDARIN_VOCAB_EN, "Mandarin", "SMA", MANDARIN_FACTS_EN),
  },
};

/* ================= BANK SOAL TERTULIS — Bahasa Inggris ================= */
/* Padanan Bahasa Inggris dari BANK (questions.ts) untuk mapel yang
   tersedia di tipe sekolah Cambridge. Mapel cambridge-* tidak perlu di
   sini: soal tertulisnya sudah Bahasa Inggris di BANK. */
export const BANK_EN: Partial<Record<JenjangId, Partial<Record<string, Question[]>>>> = {
  TK: {
    inggris: [
      { q: "Which number is the SMALLEST?", stimulus: "7   13   17   21   24   27   30", options: ["7", "13", "30"], answer: 0, explain: "7 is the smallest number in the list." },
      { q: "Arrange the letters to form the number word: T – W – E – N – T – Y – T – W – O", stimulus: "T W E N T Y T W O", options: ["TWENTY TWO", "TWENTY ONE", "THIRTY TWO"], answer: 0, explain: "T-W-E-N-T-Y-T-W-O spells TWENTY TWO (22)." },
      { q: "What number comes right AFTER 14?", options: ["13", "15", "16"], answer: 1, explain: "Count forward: 12, 13, 14, 15. So after 14 comes 15." },
      { q: "Complete the word: B _ R D (an animal that can fly)", options: ["I", "A", "U"], answer: 0, explain: "B-I-R-D = BIRD, a flying animal." },
      { q: "What number is BETWEEN 8 and 10?", options: ["7", "9", "11"], answer: 1, explain: "In order: 8, 9, 10. The number between them is 9." },
      { q: "What do you do FIRST in the morning?", stimulus: "Eat breakfast → Wake up → Brush teeth", options: ["Wake up", "Eat breakfast", "Brush teeth"], answer: 0, explain: "The correct order: wake up, brush teeth, then eat breakfast." },
      { q: "Which word means 'kucing' in English?", options: ["Dog", "Cat", "Bird"], answer: 1, explain: "Kucing in English is 'cat'." },
      { q: "How many letters are in the word 'APPLE'?", options: ["4", "5", "6"], answer: 1, explain: "A-P-P-L-E has 5 letters." },
    ],
    matematika: [
      { q: "How many apples are there? 🍎🍎🍎🍎🍎🍎", options: ["5", "6", "7"], answer: 1, explain: "Count them one by one: there are 6 apples." },
      { q: "3 + 2 = …", options: ["4", "5", "6"], answer: 1, explain: "3 plus 2 makes 5." },
      { q: "Which shape has 3 sides?", options: ["Square", "Triangle", "Circle"], answer: 1, explain: "A triangle has 3 sides; a square has 4; a circle has none." },
      { q: "Complete the pattern: 2, 4, 6, …", options: ["7", "8", "10"], answer: 1, explain: "The pattern adds 2 each time: 2, 4, 6, 8." },
      { q: "Which is BIGGER: 9 or 5?", options: ["5", "The same", "9"], answer: 2, explain: "9 is bigger than 5." },
      { q: "5 − 1 = …", options: ["3", "4", "6"], answer: 1, explain: "5 minus 1 leaves 4." },
    ],
    sains: [
      { q: "Which animal can FLY?", options: ["Fish", "Bird", "Cat"], answer: 1, explain: "Birds have wings and can fly." },
      { q: "Plants need … to grow well.", options: ["Sunlight and water", "Darkness", "Plastic"], answer: 0, explain: "Plants need sunlight and water to grow." },
      { q: "Which sense do we use to HEAR sounds?", options: ["Eyes", "Ears", "Nose"], answer: 1, explain: "We hear sounds with our ears." },
      { q: "When it rains, the sky is usually …", options: ["Clear and bright", "Cloudy and grey", "Full of stars"], answer: 1, explain: "Rain falls from thick grey clouds." },
      { q: "A baby cat is called a …", options: ["Puppy", "Kitten", "Calf"], answer: 1, explain: "A baby cat is a kitten; a puppy is a baby dog; a calf is a baby cow." },
    ],
    informatika: [
      { q: "Which device do we use to TYPE letters on a computer?", options: ["Keyboard", "Monitor", "Speaker"], answer: 0, explain: "The keyboard is used for typing letters and numbers." },
      { q: "Which part of the computer shows pictures and words?", options: ["Mouse", "Monitor / screen", "Printer"], answer: 1, explain: "The monitor (screen) displays everything we see." },
      { q: "Which device do we move and click with our hand?", options: ["Keyboard", "Mouse", "Monitor"], answer: 1, explain: "The mouse is held in the hand, moved around, and clicked." },
      { q: "To hear sounds from a tablet or computer, we use a …", options: ["Speaker / earphone", "Camera", "Charger"], answer: 0, explain: "Speakers and earphones produce sound." },
      { q: "Which device prints pictures onto paper?", options: ["Scanner", "Printer", "Mouse"], answer: 1, explain: "A printer prints onto paper." },
      { q: "What should we do before using a gadget?", options: ["Ask permission from Mum / Dad / a teacher", "Use it right away without telling anyone", "Hide it from adults"], answer: 0, explain: "Always ask permission from an adult before using a gadget." },
      { q: "Playing with a tablet for too long can make our eyes …", options: ["Healthier", "Tired and sore", "Sharper"], answer: 1, explain: "Looking at a screen too long makes eyes tired; take breaks and play outside too." },
      { q: "Which device do we use to TAKE PHOTOS?", options: ["Camera", "Speaker", "Keyboard"], answer: 0, explain: "A camera is for taking photos and videos." },
      { q: "When a tablet's battery is empty, we use a … to fill it up again.", options: ["Charger", "Mouse", "Printer"], answer: 0, explain: "A charger refills the battery with power." },
      { q: "Which is a good habit when using a tablet?", options: ["Share the password with strangers", "Play for a short while, then rest", "Watch all day without stopping"], answer: 1, explain: "Use gadgets for a short time, rest your eyes, and never share passwords with strangers." },
    ],
    sejarah: [
      { q: "What are the colours of the Indonesian flag?", options: ["Red and white", "Blue and yellow", "Green and red"], answer: 0, explain: "The Indonesian flag, Sang Saka Merah Putih, is red on top and white below." },
      { q: "What is the title of Indonesia's national anthem?", options: ["Indonesia Raya", "Garuda Pancasila", "Maju Tak Gentar"], answer: 0, explain: "The national anthem of Indonesia is 'Indonesia Raya', composed by W.R. Supratman." },
      { q: "Indonesia's Independence Day is celebrated every …", options: ["17 August", "1 June", "20 May"], answer: 0, explain: "The Proclamation of Indonesian Independence was on 17 August 1945." },
      { q: "What is the symbol of the Indonesian state?", options: ["Garuda Pancasila", "A red dragon", "A golden elephant"], answer: 0, explain: "The state symbol is Garuda Pancasila, a garuda bird holding a shield." },
      { q: "Who was the first President of Indonesia?", options: ["Ir. Soekarno", "Mohammad Hatta", "Jenderal Sudirman"], answer: 0, explain: "Ir. Soekarno was the first President; Mohammad Hatta was the first Vice President." },
      { q: "Heroes are people who …", options: ["Fight bravely for their country", "Are afraid and run away", "Only think of themselves"], answer: 0, explain: "Heroes fought bravely and selflessly for the nation's independence." },
      { q: "What is the capital city of Indonesia?", options: ["Jakarta", "Bandung", "Surabaya"], answer: 0, explain: "The capital of Indonesia is Jakarta." },
      { q: "What does the RED colour on the Indonesian flag mean?", options: ["Bravery", "Purity", "Peace"], answer: 0, explain: "Red means bravery; white means purity." },
      { q: "How many principles (sila) are there in Pancasila?", options: ["5 principles", "3 principles", "7 principles"], answer: 0, explain: "Pancasila has five principles, pictured on the shield of Garuda." },
      { q: "The song 'Indonesia Raya' was composed by …", options: ["W.R. Supratman", "Ismail Marzuki", "Ibu Sud"], answer: 0, explain: "Wage Rudolf Supratman composed Indonesia Raya in 1928." },
      { q: "A heroine famous for her letters about girls' education is …", options: ["R.A. Kartini", "Cut Nyak Dien", "Dewi Sartika"], answer: 0, explain: "R.A. Kartini fought for women's education through her letters, 'Habis Gelap Terbitlah Terang'." },
      { q: "The first principle of Pancasila is pictured by a …", options: ["Star", "Chain", "Banyan tree"], answer: 0, explain: "The first principle, Belief in One God, is pictured by a star." },
      { q: "Heroes Day is celebrated every …", options: ["10 November", "17 August", "21 April"], answer: 0, explain: "Heroes Day, 10 November, remembers the Battle of Surabaya in 1945." },
      { q: "Before independence, Indonesia was colonised mainly by …", options: ["The Netherlands (Dutch)", "Japan only for a month", "No one at all"], answer: 0, explain: "The Dutch colonised Indonesia for a very long time; Japan occupied it in 1942–1945." },
    ],
  },
  SD: {
    matematika: [
      { q: "The result of 245 + 378 is …", options: ["613", "623", "633"], answer: 1, explain: "245 + 378 = 623." },
      { q: "3/4 + 1/4 = …", options: ["4/8", "1", "2/4"], answer: 1, explain: "Same denominators: 3/4 + 1/4 = 4/4 = 1." },
      { q: "The number pattern 5, 10, 15, 20, … — the next number is …", options: ["22", "24", "25"], answer: 2, explain: "The pattern adds 5: 20 + 5 = 25." },
      { q: "A rectangle has length 8 cm and width 5 cm. Its area is …", options: ["26 cm²", "40 cm²", "13 cm²"], answer: 1, explain: "Area = length × width = 8 × 5 = 40 cm²." },
      { q: "Which fraction is the LARGEST?", options: ["1/2", "1/4", "1/8"], answer: 0, explain: "The same numerator: the smaller the denominator, the larger the fraction. 1/2 is the largest." },
      { q: "The result of 12 × 6 is …", options: ["66", "72", "78"], answer: 1, explain: "12 × 6 = 72." },
      { q: "Rp10.000 − Rp3.750 = …", options: ["Rp6.250", "Rp6.350", "Rp7.250"], answer: 0, explain: "10.000 − 3.750 = 6.250." },
      { q: "The LCM of 4 and 6 is …", options: ["10", "12", "24"], answer: 1, explain: "Multiples of 4: 4, 8, 12… Multiples of 6: 6, 12… The smallest common one is 12." },
    ],
    inggris: [
      { q: "She ___ to school every day.", options: ["go", "goes", "going"], answer: 1, explain: "For she/he/it in the simple present, add -es: goes." },
      { q: "The plural of 'child' is …", options: ["childs", "childes", "children"], answer: 2, explain: "Child is an irregular plural: children." },
      { q: "I have ___ apple in my bag.", options: ["a", "an", "the"], answer: 1, explain: "Use 'an' before words starting with a vowel sound: an apple." },
      { q: "What is the opposite of 'hot'?", options: ["warm", "cold", "dry"], answer: 1, explain: "The opposite of hot is cold." },
      { q: "They ___ playing football now.", options: ["is", "am", "are"], answer: 2, explain: "'They' pairs with 'are' in the present continuous." },
      { q: "Yesterday, we ___ a movie together.", options: ["watch", "watched", "watches"], answer: 1, explain: "'Yesterday' signals the past: watched." },
    ],
    sains: [
      { q: "The process by which plants make their own food is called …", options: ["Respiration", "Photosynthesis", "Digestion"], answer: 1, explain: "Photosynthesis: plants cook food using sunlight, water, and CO₂." },
      { q: "Which part of the plant absorbs water from the soil?", options: ["Leaf", "Flower", "Root"], answer: 2, explain: "Roots absorb water and minerals from the soil." },
      { q: "Water that is heated until it becomes vapour undergoes …", options: ["Freezing", "Evaporation", "Condensation"], answer: 1, explain: "Liquid → gas is evaporation." },
      { q: "Which animal is a herbivore (plant eater)?", options: ["Tiger", "Cow", "Snake"], answer: 1, explain: "Cows eat grass/plants, so they are herbivores." },
      { q: "The force that pulls objects toward the Earth is called …", options: ["Friction", "Magnetism", "Gravity"], answer: 2, explain: "Gravity pulls everything toward the centre of the Earth." },
      { q: "Which object can be attracted by a magnet?", options: ["Wooden ruler", "Iron nail", "Plastic cup"], answer: 1, explain: "Magnets attract iron and steel objects." },
    ],
    ips: [
      { q: "The capital of West Java Province is …", options: ["Semarang", "Bandung", "Surabaya"], answer: 1, explain: "Bandung is the capital of West Java." },
      { q: "The island of Borneo is known in Indonesia as …", options: ["Java", "Sumatra", "Kalimantan"], answer: 2, explain: "The island of Borneo is called Kalimantan in Indonesia." },
      { q: "The activity of buying and selling goods in a market is called …", options: ["Production", "Trade", "Consumption"], answer: 1, explain: "Buying and selling is trade (distribution)." },
      { q: "Mount Merapi is located in the province of …", options: ["Central Java / Yogyakarta", "West Java", "East Java"], answer: 0, explain: "Merapi stands on the border of Central Java and Yogyakarta." },
      { q: "Money used as the official payment tool in Indonesia is the …", options: ["Dollar", "Ringgit", "Rupiah"], answer: 2, explain: "Indonesia's currency is the Rupiah (Rp)." },
    ],
    informatika: [
      { q: "CPU stands for …", options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility"], answer: 0, explain: "CPU = Central Processing Unit, the 'brain' of the computer." },
      { q: "Which of these is an INPUT device?", options: ["Monitor", "Keyboard", "Printer"], answer: 1, explain: "The keyboard inputs data; the monitor and printer output it." },
      { q: "A safe password should …", options: ["Use your birth date", "Be a mix of letters, numbers, and symbols", "Be shared with friends"], answer: 1, explain: "Strong passwords mix characters and are never shared." },
      { q: "The program used to browse the internet is called a …", options: ["Browser", "Folder", "Recycle bin"], answer: 0, explain: "Browsers (Chrome, Firefox, etc.) open web pages." },
    ],
  },
  SMP: {
    matematika: [
      { q: "If 3x − 5 = 16, then x = …", options: ["5", "6", "7"], answer: 2, explain: "3x = 21, so x = 7." },
      { q: "The 10th term of the sequence 3, 6, 9, 12, … is …", options: ["27", "30", "33"], answer: 1, explain: "Difference 3: U₁₀ = 3 + 9×3 = 30." },
      { q: "Simplify: 2(x + 3) − (x − 4) = …", options: ["x + 10", "x + 2", "3x + 10"], answer: 0, explain: "2x + 6 − x + 4 = x + 10." },
      { q: "The gradient of the line y = 3x − 7 is …", options: ["−7", "3", "−3"], answer: 1, explain: "In the form y = mx + c, m = 3." },
      { q: "A coin is tossed once. The probability of getting heads is …", options: ["1/4", "1/3", "1/2"], answer: 2, explain: "There are 2 equally likely sides, so P(heads) = 1/2." },
      { q: "The value of (−4) × (−5) − 8 is …", options: ["12", "−28", "28"], answer: 0, explain: "(−4)×(−5) = 20; 20 − 8 = 12." },
      { q: "The area of a circle with radius 7 cm (π = 22/7) is …", options: ["44 cm²", "154 cm²", "616 cm²"], answer: 1, explain: "A = πr² = 22/7 × 49 = 154 cm²." },
    ],
    inggris: [
      { q: "The report ___ by the students last week.", options: ["is written", "was written", "writes"], answer: 1, explain: "Passive past: was/were + past participle (written)." },
      { q: "If it rains tomorrow, we ___ at home.", options: ["would stay", "will stay", "stayed"], answer: 1, explain: "First conditional: If + present, will + verb." },
      { q: "She is the student ___ won the science olympiad.", options: ["which", "who", "where"], answer: 1, explain: "For a person as the subject, use 'who'." },
      { q: "The synonym of 'rapid' is …", options: ["slow", "fast", "weak"], answer: 1, explain: "Rapid = fast." },
      { q: "He has lived in Surabaya ___ 2015.", options: ["for", "since", "from"], answer: 1, explain: "Present perfect with a starting point in time uses 'since'." },
    ],
    sains: [
      { q: "The cell organelle that produces energy (ATP) is the …", options: ["Nucleus", "Mitochondrion", "Ribosome"], answer: 1, explain: "Mitochondria are the cell's powerhouses." },
      { q: "A car moves 120 km in 2 hours. Its average speed is …", options: ["240 km/h", "60 km/h", "30 km/h"], answer: 1, explain: "v = s/t = 120/2 = 60 km/h." },
      { q: "The chemical symbol for sodium is …", options: ["S", "So", "Na"], answer: 2, explain: "Sodium = Na (from Latin 'natrium')." },
      { q: "In a food chain, organisms that make their own food are called …", options: ["Consumers", "Producers", "Decomposers"], answer: 1, explain: "Producers (plants) make food through photosynthesis." },
      { q: "The SI unit of force is the …", options: ["Joule", "Watt", "Newton"], answer: 2, explain: "Force is measured in newtons (N)." },
      { q: "A solution with pH 3 is …", options: ["Basic", "Neutral", "Acidic"], answer: 2, explain: "pH < 7 is acidic; pH 7 is neutral; pH > 7 is basic." },
    ],
    ips: [
      { q: "The Proclamation of Indonesian Independence was read by Soekarno on …", options: ["17 August 1945", "20 May 1908", "28 October 1928"], answer: 0, explain: "The Proclamation took place on Friday, 17 August 1945." },
      { q: "The organisation Budi Utomo, founded in 1908, is considered the beginning of …", options: ["The Youth Pledge", "The National Awakening", "The Reform Era"], answer: 1, explain: "20 May 1908 is celebrated as National Awakening Day." },
      { q: "Inflation is …", options: ["A general rise in prices", "A fall in the exchange rate only", "An increase in production"], answer: 0, explain: "Inflation = a general and continuous rise in prices." },
      { q: "The strait that separates Sumatra and Java is the … Strait", options: ["Malacca", "Sunda", "Makassar"], answer: 1, explain: "The Sunda Strait lies between Sumatra and Java." },
    ],
    informatika: [
      { q: "The binary number 1010 in decimal is …", options: ["8", "10", "12"], answer: 1, explain: "1010₂ = 8 + 2 = 10." },
      { q: "In a spreadsheet, the formula to ADD a range of cells uses the function …", options: ["=AVERAGE", "=SUM", "=MAX"], answer: 1, explain: "=SUM adds up a range of cells." },
      { q: "Malware that locks your files and demands payment is called …", options: ["Ransomware", "Firewall", "Antivirus"], answer: 0, explain: "Ransomware encrypts files and demands a ransom." },
      { q: "In a flowchart, a decision (yes/no) is drawn as a …", options: ["Rectangle", "Oval", "Diamond"], answer: 2, explain: "A diamond = decision; a rectangle = process; an oval = start/end." },
    ],
  },
  SMA: {
    matematika: [
      { q: "The derivative of f(x) = 3x² − 5x + 2 is …", options: ["6x − 5", "3x − 5", "6x² − 5"], answer: 0, explain: "f'(x) = 6x − 5." },
      { q: "The value of lim (x→2) (x² − 4)/(x − 2) is …", options: ["0", "2", "4"], answer: 2, explain: "Factor: (x−2)(x+2)/(x−2) = x + 2 → 4." },
      { q: "If ²log 32 = x, then x = …", options: ["4", "5", "6"], answer: 1, explain: "2⁵ = 32, so ²log 32 = 5." },
      { q: "The sum of the first 10 terms of 2 + 5 + 8 + … is …", options: ["145", "155", "165"], answer: 1, explain: "S₁₀ = 10/2 × (2×2 + 9×3) = 5 × 31 = 155." },
      { q: "The number of ways to choose 2 students from 6 is …", options: ["12", "15", "30"], answer: 1, explain: "C(6,2) = 6!/(2!4!) = 15." },
      { q: "The roots of x² − 5x + 6 = 0 are …", options: ["1 and 6", "2 and 3", "−2 and −3"], answer: 1, explain: "(x−2)(x−3) = 0 → x = 2 or x = 3." },
    ],
    inggris: [
      { q: "Had I known about the traffic, I ___ earlier.", options: ["will leave", "would have left", "would leave"], answer: 1, explain: "Third conditional (inverted): would have + past participle." },
      { q: "Choose the sentence with the correct subjunctive:", options: ["I suggest that he goes now.", "I suggest that he go now.", "I suggest that he going now."], answer: 1, explain: "After 'suggest that …', use the base verb form: go." },
      { q: "The phrase 'break the ice' in a meeting means …", options: ["To end the meeting", "To cool the room", "To start a conversation and ease awkwardness"], answer: 2, explain: "An idiom: to ease the atmosphere and start talking." },
      { q: "'The committee ___ reached its decision.' (formal usage)", options: ["have", "has", "are"], answer: 1, explain: "A collective noun as a single unit takes 'has'." },
    ],
    biologi: [
      { q: "In aerobic respiration, the stage producing the most ATP is …", options: ["Glycolysis", "The Krebs cycle", "The electron transport chain"], answer: 2, explain: "The electron transport chain produces about 34 ATP." },
      { q: "A dihybrid cross AaBb × AaBb gives a 9:3:3:1 phenotype ratio in the offspring. This pattern is explained by …", options: ["Mendel's law of independent assortment", "Incomplete dominance", "Codominance"], answer: 0, explain: "In a dihybrid cross, the two gene pairs separate independently, giving the 9:3:3:1 phenotype ratio." },
      { q: "The enzyme that joins Okazaki fragments during DNA replication is …", options: ["Helicase", "DNA ligase", "Primase"], answer: 1, explain: "DNA ligase seals the fragments on the lagging strand." },
      { q: "The breathing organ of insects is the …", options: ["Lungs", "Gills", "Tracheal system"], answer: 2, explain: "Insects breathe through tracheae and spiracles." },
    ],
    fisika: [
      { q: "An object falls freely from rest (g = 10 m/s²). Its speed after 3 s is …", options: ["10 m/s", "20 m/s", "30 m/s"], answer: 2, explain: "v = g·t = 10 × 3 = 30 m/s." },
      { q: "A resistor of 6 Ω is connected to 12 V. The current is …", options: ["0.5 A", "2 A", "72 A"], answer: 1, explain: "I = V/R = 12/6 = 2 A." },
      { q: "The kinetic energy of a 2 kg object moving at 5 m/s is …", options: ["10 J", "25 J", "50 J"], answer: 1, explain: "KE = ½mv² = ½ × 2 × 25 = 25 J." },
      { q: "A wave has frequency 10 Hz and wavelength 2 m. Its speed is …", options: ["5 m/s", "12 m/s", "20 m/s"], answer: 2, explain: "v = f·λ = 10 × 2 = 20 m/s." },
    ],
    kimia: [
      { q: "The electron configuration of Fe (Z = 26) is …", options: ["[Ar] 4s² 3d⁶", "[Ar] 4s¹ 3d⁷", "[Ne] 4s² 3d⁶"], answer: 0, explain: "Fe: 1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁶." },
      { q: "The oxidation number of S in H₂SO₄ is …", options: ["+2", "+4", "+6"], answer: 2, explain: "2(+1) + S + 4(−2) = 0 → S = +6." },
      { q: "A solution has [H⁺] = 10⁻³ M. Its pH is …", options: ["3", "7", "11"], answer: 0, explain: "pH = −log[H⁺] = 3." },
      { q: "A buffer solution consists of …", options: ["A strong acid and a strong base", "A weak acid and its conjugate base", "Salt and water only"], answer: 1, explain: "Buffers pair a weak acid with its conjugate base (or the reverse)." },
    ],
    ips: [
      { q: "The economic theory of laissez-faire (minimal government intervention) was put forward by …", options: ["Karl Marx", "Adam Smith", "John Maynard Keynes"], answer: 1, explain: "Adam Smith, 'The Wealth of Nations' (1776)." },
      { q: "World War II in the Pacific theatre ended after the atomic bombings of Hiroshima and Nagasaki in …", options: ["1943", "1944", "1945"], answer: 2, explain: "August 1945; Japan surrendered and WWII ended." },
      { q: "One function of a country's foreign exchange reserves is to …", options: ["Pay for imports and foreign debt", "Print new money", "Pay civil servants' salaries"], answer: 0, explain: "Reserves settle international transactions." },
      { q: "The 'Dwifungsi ABRI' concept and strong political stability characterised the era of …", options: ["Liberal Democracy", "The New Order", "Reformasi"], answer: 1, explain: "The New Order era (1966–1998)." },
    ],
    informatika: [
      { q: "In the OSI model, the layer responsible for routing and IP addressing is the …", options: ["Transport layer", "Network layer", "Data Link layer"], answer: 1, explain: "Layer 3 (Network) handles routing and logical addressing (IP)." },
      { q: "A phishing attack aims to …", options: ["Speed up the network", "Steal credentials through fake pages/messages", "Back up data automatically"], answer: 1, explain: "Phishing tricks victims into giving away passwords/data." },
      { q: "In a relational database, a column (attribute) is called a …", options: ["Record", "Field", "Table"], answer: 1, explain: "A column = field; a row = record; the whole = table." },
      { q: "DNS functions to …", options: ["Translate domain names into IP addresses", "Encrypt all data", "Store website files"], answer: 0, explain: "DNS is the internet's phone book: name → IP address." },
    ],
  },
};

/* ================= MODUL PERPUSTAKAAN — Bahasa Inggris ================= */
/* Terjemahan modul "i" (library.ts) untuk mapel Cambridge. Kunci = id
   modul; fallback (modul turunan MATERIALS) memakai MATERIALS_EN di
   bawah ini berdasarkan subjectId. */
export const MODULE_EN: Record<string, { title: string; concept: string; example: string; summary: string; keywords: string[]; worked?: string; vocab?: string; fact?: string; reading?: LibraryModule["reading"] }> = {
  "sains-makhluk-hidup": { title: "Living Things & Their Environment", concept: "Living things (humans, animals, plants) have special characteristics: they breathe, need food and water, move, grow, reproduce, and respond to stimuli. Animals live in habitats that suit them: fish in water, birds in the air and trees, camels in deserts. Plants also adapt: cactus stems store water, lotus leaves are wide and float.", example: "A goldfish breathes with gills in the water, while a cat breathes with lungs on land — each suits its habitat.", summary: "Living things breathe, eat, move, and grow; every living thing suits its habitat.", keywords: ["animal", "plant", "living", "breathe", "habitat", "lives in", "fish", "bird"] },
  "sains-tubuh-indera": { title: "The Human Body & The Five Senses", concept: "Our five senses: eyes for seeing, ears for hearing, nose for smelling, tongue for tasting, skin for feeling. Inside the body: the heart pumps blood, the lungs take in air for breathing, the stomach digests food, bones support the body, and muscles help us move.", example: "When we run, the heart beats faster and we breathe quickly because the body needs more oxygen.", summary: "Senses receive the world; the heart, lungs, stomach, bones, and muscles keep the body working.", keywords: ["eye", "ear", "nose", "tongue", "skin", "heart", "lung", "sense", "hear", "see"] },
  "sains-tumbuhan": { title: "Plant Parts & Photosynthesis", concept: "Plant parts: roots absorb water and minerals, the stem supports the plant and carries water, leaves cook food, flowers reproduce, fruit protects seeds. Photosynthesis is the process of cooking food in the leaves using sunlight, water, and carbon dioxide gas, producing food and oxygen. It happens in the green parts (chlorophyll).", example: "A mango tree planted in a sunny spot with regular watering grows lush and fruits quickly.", summary: "Roots absorb, stems carry, leaves cook food through photosynthesis with sunlight.", keywords: ["plant", "root", "leaf", "leaves", "stem", "flower", "photosynthesis", "absorb", "tree"] },
  "sains-energi-wujud": { title: "Energy & States of Matter", concept: "Matter has three states: solid (fixed shape), liquid (follows its container), gas (fills the space). Changes of state: melting (solid→liquid), freezing (liquid→solid), evaporation (liquid→gas), condensation (gas→liquid), sublimation (solid→gas). Energy comes in many forms: heat, light, sound, electricity, motion. Sources of energy: the Sun (the largest), water, wind, and fuel.", example: "Ice cubes melt into water in the sun (melting); water vapour on a cold glass lid becomes droplets (condensation).", summary: "Matter changes state when heated or cooled; energy makes things move, glow, and sound.", keywords: ["energy", "heat", "ice", "evaporat", "melt", "freeze", "condens", "state of matter", "sun"] },
  "sains-bumi-antariksa": { title: "Earth, the Solar System & Space", concept: "The Solar System: the Sun at the centre, orbited by 8 planets — Mercury, Venus, Earth, Mars, Jupiter (the largest), Saturn (with rings), Uranus, Neptune. Earth rotates (causing day and night) and revolves around the Sun (causing the seasons/year). The Moon is Earth's satellite; its phases change through the month. The closest star to Earth is the Sun.", example: "Because Earth rotates, the Sun seems to rise in the east in the morning and set in the west in the evening.", summary: "Earth is the third planet; rotation makes day and night, and planets orbit the Sun.", keywords: ["planet", "earth", "sun", "moon", "star", "orbit", "solar", "rotate"] },
  "sains-gaya-gerak": { title: "Force, Motion & Simple Machines", concept: "A force is a push or a pull; it can move, stop, or change the shape of objects. Types of force: muscle, gravity (pulls toward Earth), friction (opposes motion — rough surfaces give more), magnetism, electricity, springs. Speed = distance ÷ time (v = s/t). Simple machines make work easier: levers, pulleys, inclined planes, wheels.", example: "A bicycle moves faster on smooth asphalt than on gravel because friction is smaller.", summary: "Forces push/pull; gravity pulls down; friction opposes; speed = distance over time.", keywords: ["force", "speed", "gravity", "friction", "magnet", "motion", "velocity", "km/h"] },
  "sains-zat-materi": { title: "Matter, Elements & Compounds", concept: "Elements are the simplest substances, written with symbols: H (hydrogen), O (oxygen), Fe (iron), Au (gold), Na (sodium), C (carbon). Compounds are combinations of elements: H₂O (water), CO₂ (carbon dioxide), NaCl (table salt). Mixtures can be separated physically (filtering, magnets, evaporation). Solutions are measured by pH: <7 acidic, 7 neutral, >7 basic/alkaline.", example: "Sand mixed with iron powder can be separated with a magnet — no chemical change needed.", summary: "Elements have symbols; compounds combine elements; pH measures acidity.", keywords: ["element", "symbol", "compound", "acid", "ph", "sodium", "iron", "oxygen", "hydrogen"] },
  "sains-sel-organ": { title: "Cells & Organelles", concept: "The cell is the smallest unit of life. Animal cell parts: cell membrane (protects and controls entry/exit), cytoplasm (the jelly), nucleus (controls activities and stores DNA), mitochondria (produce energy/ATP), ribosomes (make proteins), vacuole (storage — large in plants). Plant cells also have a cell wall and chloroplasts for photosynthesis.", example: "Muscle cells have many mitochondria because muscles need lots of energy to move.", summary: "The nucleus commands, mitochondria energise, ribosomes build proteins.", keywords: ["cell", "organelle", "mitochondri", "nucleus", "ribosome", "membrane", "vacuole", "chloroplast"] },
  "sains-ekosistem": { title: "Ecosystems & Food Chains", concept: "An ecosystem is living things interacting with their environment. In a food chain: producers (plants make their own food) → consumers (herbivores eat plants, carnivores eat meat, omnivores eat both) → decomposers (bacteria and fungi break down remains). Symbiosis: mutualism (both benefit), commensalism (one benefits, other unaffected), parasitism (one benefits, other harmed).", example: "Grass → grasshopper → frog → snake → eagle is a food chain in a rice field.", summary: "Producers make food, consumers eat, decomposers recycle; balance keeps ecosystems alive.", keywords: ["food chain", "producer", "consumer", "ecosystem", "herbivore", "carnivore", "decomposer", "symbiosis"] },
  "sains-listrik-magnet": { title: "Electricity & Magnetism", concept: "Electric current flows in a closed circuit: source (battery) → wires → load (lamp). Series circuits share one path (one lamp out, all out); parallel circuits have branches (brighter, independent). Ohm's law: V = I × R. Electrical power P = V × I. Magnets attract iron/steel, have north and south poles; like poles repel, unlike poles attract.", example: "House lights use parallel circuits so one lamp can be off while others stay on.", summary: "Current needs a closed loop; V = I×R; parallel circuits keep lamps independent.", keywords: ["electric", "current", "circuit", "volt", "ohm", "magnet", "battery", "resistor", "ampere"] },
  "bio-respirasi": { title: "Respiration & Energy (ATP)", concept: "Cellular respiration breaks down glucose to produce ATP energy. Stages: glycolysis (in the cytoplasm, 2 ATP), the Krebs cycle (in the mitochondria), and the electron transport chain (produces the most ATP, about 34). Aerobic respiration needs oxygen; anaerobic (fermentation) does not and produces little ATP plus lactic acid or alcohol.", example: "After sprinting, muscles ache because fermentation produces lactic acid when oxygen runs low.", summary: "Most ATP comes from the electron transport chain in the mitochondria.", keywords: ["respiration", "atp", "glycolysis", "krebs", "electron transport", "fermentation"] },
  "bio-genetika": { title: "Genetics & Heredity", concept: "Genes on DNA determine inherited traits. Dominant traits (capital letters, e.g. A) mask recessive ones (a). A monohybrid cross Aa × Aa gives phenotypes 3:1. A dihybrid cross AaBb × AaBb (independent assortment) gives 9:3:3:1. DNA replication is helped by enzymes: helicase unwinds, primase starts, polymerase builds, ligase joins Okazaki fragments.", example: "Two parents with free earlobes (Aa) can have a child with attached earlobes (aa) — the recessive trait appears.", summary: "Dominant masks recessive; dihybrid = 9:3:3:1; ligase joins DNA fragments.", keywords: ["genotype", "cross", "dominant", "recessive", "dna", "ligase", "gene", "okazaki"] },
  "bio-enzim": { title: "Enzymes & Metabolism", concept: "Enzymes are biological catalysts: proteins that speed up reactions without being used up. Each enzyme is specific (lock and key / induced fit) and works best at an optimal temperature and pH. Examples: amylase breaks starch into sugar, protease breaks protein, lipase breaks fat, lactase breaks lactose.", example: "Saliva contains amylase, so chewed rice starts tasting sweet as starch becomes sugar.", summary: "Enzymes are specific catalysts with optimal pH and temperature.", keywords: ["enzyme", "amylase", "lipase", "protease", "catalyst"] },
  "fis-gerak": { title: "Motion & Kinematics", concept: "Uniform motion: v = s/t. Accelerated motion (GLBB): v = v₀ + at; s = v₀t + ½at²; v² = v₀² + 2as. Free fall is GLBB with a = g (≈10 m/s²) and v₀ = 0. Newton's laws: I (inertia), II (F = ma), III (action–reaction).", example: "A dropped stone speeds up by 10 m/s every second, so after 3 s it moves at 30 m/s.", summary: "Free fall: v = g·t; Newton II: F = m·a.", keywords: ["velocity", "speed", "acceleration", "free fall", "newton", "motion", "m/s"] },
  "fis-energi": { title: "Work, Energy & Power", concept: "Kinetic energy KE = ½mv²; potential energy PE = mgh. Work W = F·s. Power P = W/t. Energy is conserved: it changes form but is never created or destroyed. Machines (levers, pulleys) trade force for distance.", example: "A 2 kg ball at 5 m/s has KE = ½ × 2 × 25 = 25 joules.", summary: "KE = ½mv², PE = mgh; energy is always conserved.", keywords: ["kinetic", "potential", "energy", "joule", "work", "power"] },
  "fis-listrik": { title: "Electric Circuits & Ohm's Law", concept: "Ohm's law: V = I × R (voltage = current × resistance). Series resistance adds up; parallel resistance combines as 1/R = 1/R₁ + 1/R₂. Electrical power P = V × I = I²R. Energy used = P × t (kWh on electricity bills).", example: "12 V across 6 Ω gives I = 12/6 = 2 amperes.", summary: "V = I·R; series adds, parallel shares; P = V·I.", keywords: ["ohm", "voltage", "current", "resistance", "circuit", "ampere", "watt"] },
  "fis-gelombang": { title: "Waves & Sound", concept: "Wave speed v = f × λ (frequency × wavelength). Transverse waves move perpendicular to their direction (light, water); longitudinal waves move parallel (sound). Sound needs a medium; light does not. Frequency is in hertz (Hz); higher frequency = higher pitch.", example: "A wave with f = 10 Hz and λ = 2 m travels at 20 m/s.", summary: "v = f·λ for every wave, including sound and light.", keywords: ["wave", "frequency", "wavelength", "hertz", "sound"] },
  "kim-unsur": { title: "Elements & The Periodic Table", concept: "Each element has a symbol: H, He, C, N, O, Na (sodium), Mg, Al, Si, P, S, Cl, K, Ca, Fe (iron), Cu, Zn, Ag, Sn, I, Ba, Pt, Au (gold), Hg, Pb. The atomic number (Z) = number of protons = electrons in a neutral atom. Groups share similar properties; periods are rows.", example: "Fe is iron (from Latin ferrum); Au is gold (aurum).", summary: "Symbols are universal; Z counts protons.", keywords: ["element", "symbol", "periodic", "atomic", "proton"] },
  "kim-konfigurasi": { title: "Electron Configuration & Bonds", concept: "Electrons fill shells following the Aufbau order: 1s 2s 2p 3s 3p 4s 3d… Example: Fe (Z=26) = [Ar] 4s² 3d⁶. Atoms bond to reach a stable octet: ionic bonds transfer electrons (metal + non-metal), covalent bonds share electrons (non-metal + non-metal).", example: "Na (2,8,1) easily loses 1 electron to become stable like neon.", summary: "Fill 4s before 3d; bonds aim for a stable octet.", keywords: ["configuration", "electron", "orbital", "bond", "octet", "fe ("] },
  "kim-ph": { title: "Acids, Bases & pH", concept: "pH = −log[H⁺]. pH < 7 acidic (lemon, vinegar), pH = 7 neutral (pure water), pH > 7 basic (soap). Indicators change colour: litmus turns red in acid, blue in base. Neutralisation: acid + base → salt + water.", example: "[H⁺] = 10⁻³ means pH 3 — quite acidic.", summary: "pH measures [H⁺]; acid + base neutralise each other.", keywords: ["ph", "acid", "base", "alkaline", "neutral", "litmus"] },
  "kim-biloks-buffer": { title: "Oxidation Numbers & Buffer Solutions", concept: "Oxidation number rules: free elements = 0; H usually +1; O usually −2; the sum in a neutral compound = 0, in an ion = its charge. Example: S in H₂SO₄ = +6. A buffer resists pH change: it mixes a weak acid with its conjugate base (or a weak base with its conjugate acid), e.g. CH₃COOH + CH₃COONa.", example: "Blood is buffered so its pH stays near 7.4 even when we eat acidic food.", summary: "Sum of oxidation numbers = 0 (compound); buffers keep pH steady.", keywords: ["oxidation", "buffer", "conjugate", "h₂so₄", "oxidation number"] },
  "mat-operasi": { title: "Number Operations", concept: "Order of operations: brackets first, then multiplication/division, then addition/subtraction. Negative numbers: minus × minus = plus; plus × minus = minus. Big additions and subtractions are easier column by column, watching the carries and borrows.", example: "3 + 4 × 2 = 11 (multiply first), not 14.", summary: "Brackets → × ÷ → + −; two minuses make a plus.", keywords: ["result of", "×", "+", "−", "simplify", "value of"] },
  "mat-pecahan": { title: "Fractions", concept: "A fraction a/b: a is the numerator, b the denominator. Add/subtract only with the same denominator (use the LCM). Multiply: top × top, bottom × bottom. Divide: flip the second fraction then multiply. Comparing fractions with the same numerator: the smaller denominator is the bigger fraction.", example: "3/4 + 1/4 = 4/4 = 1 whole.", summary: "Same denominator to add; flip and multiply to divide.", keywords: ["fraction", "3/4", "1/2", "numerator", "denominator"] },
  "mat-fpb-kpk-pola": { title: "GCF, LCM & Number Patterns", concept: "The GCF (HCF) is the largest number dividing both; the LCM is the smallest multiple of both. Find them with prime factorisation: GCF takes the smallest powers, LCM the largest. Number patterns: arithmetic sequences add a constant difference; the n-th term Uₙ = a + (n−1)d.", example: "LCM of 4 and 6 is 12; GCF of 12 and 18 is 6.", summary: "GCF = smallest shared powers; LCM = largest; Uₙ = a + (n−1)d.", keywords: ["lcm", "gcf", "pattern", "sequence", "term", "multiples"] },
  "mat-bangun": { title: "Shapes, Area & Volume", concept: "Areas: rectangle = length × width; triangle = ½ × base × height; circle = πr² (π ≈ 22/7 or 3.14), circumference = 2πr. Volumes: cuboid = l × w × h; cylinder = πr²h; sphere = 4/3πr³. The Pythagorean theorem: c² = a² + b² for right triangles.", example: "A circle with r = 7 cm has area 22/7 × 49 = 154 cm².", summary: "Memorise area/volume formulas and Pythagoras c² = a² + b².", keywords: ["area", "volume", "circle", "rectangle", "radius", "triangle", "cm²", "hypotenuse"] },
  "mat-uang-satuan": { title: "Money, Units & Measurement", concept: "Unit ladders: km–hm–dam–m–dm–cm–mm (×10 per step down). Weight: 1 kg = 1.000 g; 1 ton = 1.000 kg. Time: 1 hour = 60 minutes = 3.600 seconds. Money problems use careful column subtraction; profit = selling price − cost price; discount = % × original price.", example: "Rp10.000 − Rp3.750 = Rp6.250 change.", summary: "Convert units step by step; profit = sell − cost.", keywords: ["rp", "kg", "gram", "metre", "cm", "hour", "minute", "discount", "profit", "price"] },
  "mat-aljabar": { title: "Algebra & Equations", concept: "Algebra uses letters for unknown numbers. Collect like terms: 2x + 6 − x + 4 = x + 10. Solve equations by balancing both sides: 3x − 5 = 16 → 3x = 21 → x = 7. The gradient of y = mx + c is m. Two-variable systems can be solved by substitution or elimination.", example: "If 5x = 35, then x = 35 ÷ 5 = 7.", summary: "Balance both sides; collect like terms; gradient = m in y = mx + c.", keywords: ["equation", "gradient", "variable", "solve", "3x", "algebra", "line"] },
  "mat-lanjut": { title: "Advanced Maths: Functions, Limits & Counting", concept: "Derivative: d/dx of axⁿ is a·n·xⁿ⁻¹ (power rule). Limits: try direct substitution; if 0/0, factorise first. Logarithms: a^log x asks 'a to what power gives x'. Arithmetic series sum Sₙ = n/2 (2a + (n−1)d). Combinations C(n,r) = n!/(r!(n−r)!) count unordered choices; permutations count ordered ones.", example: "²log 32 = 5 because 2⁵ = 32.", summary: "Power rule for derivatives; factorise 0/0 limits; C(n,r) for choices.", keywords: ["derivative", "limit", "log", "series", "combination", "permutation", "roots", "determinant"] },
  "ing-vocab": { title: "English Vocabulary", concept: "Vocabulary grows by grouping words: animals (cat, dog, bird), food (apple, rice), school (book, pencil, teacher), nature (sun, moon, river). Learn opposites in pairs (hot–cold, big–small) and irregular plurals (child–children, foot–feet).", example: "'Library' is the place full of books; 'garden' is land for plants.", summary: "Learn words in groups, pairs of opposites, and tricky plurals.", keywords: ["means", "english word", "word", "opposite"] },
  "ing-grammar": { title: "English Grammar Patterns", concept: "Simple present: he/she/it adds -s/-es (she goes). Present continuous: be + verb-ing for now (they are playing). Past tense for yesterday (watched, went). Passive voice: be + past participle (was written). Articles: 'a' before consonant sounds, 'an' before vowel sounds. Conditionals: If + present … will (type 1); would have + V3 for unreal past (type 3).", example: "'The report was written by the students' is passive past.", summary: "Match the tense to the time signal; passive = be + V3.", keywords: ["passive", "subjunctive", "conditional", "tense", "plural", "reported", "synonym"] },
  "kor-dasar": { title: "Korean Basics (Hangul)", concept: "Korean is written in Hangul, created by King Sejong, with 24 basic letters (14 consonants + 10 vowels). Sentence order is SOV (verb last). Particles mark roles: 이/가 subject, 을/를 object, 은/는 topic. Polite speech uses endings like -입니다. Numbers exist in two systems: Sino-Korean (일, 이, 삼) and native Korean (하나, 둘, 셋).", example: "저는 학생입니다 (jeoneun haksaeng-imnida) = I am a student.", summary: "Hangul has 24 letters; Korean sentences end with the verb.", keywords: ["korean", "hangul", "particle", "sejong"] },
  "jpn-dasar": { title: "Japanese Basics (Kana & Kanji)", concept: "Japanese uses three scripts: hiragana (native words), katakana (foreign words), and kanji (Chinese characters). Particles: は (wa) topic, を (o) object, に direction/time. The polite -masu form is used in daily polite speech. Word order is SOV.", example: "わたしは学生です (watashi wa gakusei desu) = I am a student.", summary: "Hiragana for native words, katakana for foreign ones; verb comes last.", keywords: ["japanese", "hiragana", "katakana", "kanji", "particle"] },
  "man-dasar": { title: "Mandarin Basics (Hanzi & Pinyin)", concept: "Mandarin uses hanzi characters with pinyin romanisation. It has 4 tones that change meaning (mā má mǎ mà). Word order is SVO. 吗 (ma) makes yes/no questions; 的 (de) shows possession. Measure words are needed when counting: 本 for books, 个 general, 只 for animals.", example: "我是学生 (Wǒ shì xuésheng) = I am a student.", summary: "Four tones, SVO order, and measure words for counting.", keywords: ["mandarin", "tone", "pinyin", "measure word", "hanzi"] },
  "islam-muamalah": { title: "Muamalah, Contracts & Islamic Economics", concept: "Muamalah governs dealings between people. Contracts (akad) must be clear, voluntary, and free from riba (unlawful interest), gharar (uncertainty), and maysir (gambling). Popular contracts: murabahah (sale with an agreed margin), mudharabah (one side provides capital, the other manages, profits are shared), musyarakah (joint capital), ijarah (rent/wages). Inheritance (faraid): a son receives twice a daughter's share; a wife receives 1/8 when there are children; a mother receives 1/6 when there are children.", example: "Saving at an Islamic bank with mudharabah: you provide the funds, the bank manages them, and profits are split by the ratio agreed at the start — not fixed interest.", summary: "Avoid riba, gharar, maysir. Inheritance: male : female = 2 : 1.", keywords: ["akad", "contract", "murabahah", "mudharabah", "musyarakah", "ijarah", "riba", "inheritance", "faraid", "profit sharing"] },
  "ips-geografi": { title: "Geography of Indonesia", concept: "Indonesia is an archipelago between Asia and Australia. Big islands: Sumatra, Java, Kalimantan (the largest), Sulawesi, Papua. Provinces have capitals, e.g. West Java → Bandung, East Java → Surabaya. Straits separate islands (Sunda Strait between Sumatra and Java; Malacca Strait by Sumatra and Malaysia).", example: "The capital of West Java is Bandung.", summary: "Know the big islands, provincial capitals, and famous straits.", keywords: ["capital", "province", "island", "strait", "located"] },
  "ips-sejarah": { title: "Indonesian History Highlights", concept: "Timeline: kingdoms (Sriwijaya, Majapahit) → Dutch colonisation (VOC 1602, Cultivation System 1830) → National Awakening (Budi Utomo, 1908) → Youth Pledge (28 Oct 1928) → Proclamation (17 Aug 1945 by Soekarno–Hatta) → New Order (1966–1998) → Reformasi (1998). World War II ended in 1945.", example: "Budi Utomo's founding on 20 May 1908 marks the National Awakening.", summary: "Remember the anchor years: 1602, 1830, 1908, 1928, 1945, 1998.", keywords: ["proclamation", "budi utomo", "happened", "war", "era", "kingdom"] },
  "ips-ekonomi": { title: "Economics Basics", concept: "Economic activities: production (making), distribution (delivering/trade), consumption (using). Inflation is a general rise in prices that lowers purchasing power. Trade uses money (Indonesia: the Rupiah). Foreign exchange reserves pay for imports and foreign debt. Laissez-faire (Adam Smith) means minimal government intervention.", example: "Buying and selling in a market is trade — a distribution activity.", summary: "Produce → distribute → consume; inflation = prices rising generally.", keywords: ["inflation", "trade", "money", "rupiah", "economic", "reserves", "laissez"] },
  "tik-tk": { title: "Getting to Know Devices", concept: "Computer and tablet parts: the keyboard for typing, the monitor/screen for seeing, the mouse for pointing and clicking, speakers/earphones for sound, the camera for photos, the printer for paper copies, and the charger for refilling the battery. Good habits: ask an adult first, play briefly, rest your eyes, and never share passwords.", example: "When the battery is empty, connect the charger.", summary: "Each device has a job; use gadgets briefly and safely.", keywords: ["keyboard", "monitor", "mouse", "speaker", "printer", "camera", "charger", "tablet", "device"] },
  "tik-dasar": { title: "Computer Basics (SD)", concept: "Hardware you can touch (monitor, keyboard) vs software programs (apps). Input devices send data in (keyboard, mouse, scanner); output devices show results (monitor, printer, speaker); storage keeps files (flash disk, hard disk). CPU = Central Processing Unit, the computer's brain. Browsers open websites; strong passwords mix letters, numbers, and symbols.", example: "A keyboard is input; a printer is output.", summary: "Input in, CPU processes, output out; keep passwords strong and secret.", keywords: ["cpu", "input", "output", "password", "browser", "hardware", "software", "device", "storage"] },
  "tik-smp": { title: "Computing for Junior High", concept: "Binary numbers use only 0 and 1 (1010₂ = 10). Spreadsheets: =SUM adds, =AVERAGE averages, cells are named like B2. Flowcharts: oval = start/end, rectangle = process, diamond = decision. Malware types: virus, worm, trojan, ransomware (locks files for ransom), spyware. Networks: LAN (small area) vs WAN; Wi-Fi is wireless LAN.", example: "=SUM(A1:A5) adds five cells in column A.", summary: "Binary, spreadsheet formulas, flowchart symbols, and malware names.", keywords: ["binary", "spreadsheet", "sum", "flowchart", "malware", "ransomware", "network", "lan", "shortcut", "protocol", ".zip"] },
  "tik-sma": { title: "Computing for Senior High", concept: "The OSI model has 7 layers; the Network layer (3) routes packets with IP addresses. DNS translates domain names into IP addresses. Databases: tables of records (rows) and fields (columns); queries use SELECT. Security attacks: phishing (fake pages stealing credentials), DDoS (flooding a server), MITM (eavesdropping). Programming traces follow variables step by step.", example: "A query SELECT name FROM students picks the name field from the students table.", summary: "OSI layers, DNS, databases, attacks, and careful code tracing.", keywords: ["osi", "layer", "dns", "database", "phishing", "protocol", "record", "field", "query", "program", "loop"] },
  "sej-simbol": { title: "National Symbols & Independence", concept: "Indonesia's symbols: the red-and-white flag (red = bravery, white = purity), the anthem 'Indonesia Raya' by W.R. Supratman, the Garuda Pancasila emblem, and Pancasila's five principles (star, chain, banyan tree, bull's head, rice and cotton). Independence Day is 17 August (Proclamation, 1945); the capital is Jakarta; the first President was Soekarno.", example: "The star on Garuda's shield stands for the first principle of Pancasila.", summary: "Flag, anthem, Garuda, Pancasila — know what each symbol means.", keywords: ["flag", "anthem", "garuda", "pancasila", "president", "capital", "independence", "principle", "colours"] },
  "sej-kerajaan": { title: "Kingdoms of the Archipelago", concept: "Famous kingdoms: Kutai (the oldest, Hindu, East Kalimantan), Tarumanagara (West Java), Sriwijaya (Buddhist maritime power in Sumatra controlling the Malacca Strait), Mataram Kuno, Singhasari, Majapahit (the largest, under Hayam Wuruk and Gajah Mada), Demak (the first Islamic kingdom in Java), Aceh and Gowa-Tallo (Islamic maritime powers), Bali, and Banten.", example: "Majapahit reached its peak under Hayam Wuruk with the patih Gajah Mada.", summary: "Sriwijaya ruled the seas; Majapahit united much of the archipelago.", keywords: ["kingdom", "majapahit", "sriwijaya", "demak", "hindu", "buddhist", "islamic"] },
  "sej-pahlawan": { title: "National Heroes", concept: "Heroes and their regions: Pattimura (Maluku), Cut Nyak Dien and Teuku Umar (Aceh), Diponegoro (Java, the Java War 1825–1830), Tuanku Imam Bonjol (West Sumatra, Padri War), Sultan Hasanuddin (South Sulawesi), Pangeran Antasari (South Kalimantan), Sisingamangaraja XII (North Sumatra), Martha Christina Tiahahu (Maluku), R.A. Kartini (education for women), Ki Hajar Dewantara (education), Jenderal Sudirman (guerrilla general).", example: "Diponegoro led the Java War against the Dutch from Central Java/Yogyakarta.", summary: "Match each hero to their region and struggle.", keywords: ["hero", "heroine", "came from", "fought", "region"] },
  "sej-penjajahan": { title: "The Colonial Era", concept: "The Portuguese arrived in Malacca in 1511; the Dutch followed (VOC founded 1602). Governor Daendels built the Anyer–Panarukan road; Raffles (British) ruled briefly; Van den Bosch imposed the Cultivation System (tanam paksa) in 1830. Japan occupied Indonesia from 1942 after the Kalijati agreement, until 1945.", example: "The Cultivation System forced farmers to grow export crops from 1830.", summary: "VOC 1602 → Cultivation System 1830 → Japanese occupation 1942–1945.", keywords: ["voc", "dutch", "cultivation", "colon", "portuguese", "japan", "daendels", "raffles"] },
  "sej-pergerakan-proklamasi": { title: "National Movement & The Proclamation", concept: "Budi Utomo (1908, inspired by Dr. Wahidin) began the National Awakening; Sarekat Islam was led by Tjokroaminoto. The Youth Pledge was declared on 28 October 1928. In 1945: BPUPKI prepared independence, Japan surrendered after the atomic bombings, and on 17 August 1945 Soekarno read the Proclamation; PPKI then ratified the 1945 Constitution. Fatmawati sewed the first flag.", example: "One motherland, one nation, one language — the Youth Pledge, 1928.", summary: "1908 awakening → 1928 Youth Pledge → 17 August 1945 Proclamation.", keywords: ["budi utomo", "youth pledge", "proclamation", "bpupki", "ppki", "fatmawati", "tjokroaminoto"] },
  "sej-modern": { title: "Modern Indonesia", concept: "After independence: the Dutch military aggressions, the Round Table Conference (1949, sovereignty recognised), parliamentary then Guided Democracy, the Presidential Decree of 1959, the events of 1965 (G30S), Supersemar (1966) and the New Order with its five-year Repelita plans, then Reformasi in 1998 (President Habibie) and the first democratic elections of the reform era in 1999.", example: "Reformasi began in 1998 when Soeharto resigned and Habibie became president.", summary: "1949 sovereignty → 1959 Decree → 1966 New Order → 1998 Reformasi.", keywords: ["decree", "supersemar", "reformasi", "new order", "election", "sovereignty", "repelita"] },
  "sej-dunia": { title: "World History Landmarks", concept: "World events: Mesopotamia grew between the Tigris and Euphrates rivers; the Industrial Revolution began in England. World War I started after the Sarajevo assassination (1914); World War II began with Germany's invasion of Poland (1939), spread to the Pacific with Pearl Harbor (1941), and ended in 1945 after the atomic bombings of Hiroshima and Nagasaki. The Cold War set the US bloc (NATO) against the Soviet bloc.", example: "Pearl Harbor (7 Dec 1941) brought the United States into World War II.", summary: "1914 WWI, 1939–1945 WWII, then the Cold War between two blocs.", keywords: ["world war", "pearl harbor", "hiroshima", "cold war", "nato", "mesopotamia", "industrial revolution"] },
  "ing-tk-dasar": { title: "Fun English: Colours, Animals, Numbers & Greetings", concept: "Hello, little friend! Let's learn English with pictures. 🎨 COLOURS: red 🔴, blue 🔵, yellow 🟡, green 🟢, black ⚫, white ⚪. 🐶 ANIMALS: cat 🐱, dog 🐶, bird 🐦, fish 🐟, duck 🦆, cow 🐮. 🔢 NUMBERS 1–10: one 1, two 2, three 3, four 4, five 5, six 6, seven 7, eight 8, nine 9, ten 10. 👋 GREETINGS: hello, good morning, thank you, bye-bye! 🖐️ MY BODY: eye 👀, nose 👃, hand ✋, head, mouth 👄. Say the words out loud and point at the things!", example: "In the morning you greet your teacher: 'Good morning, Miss!' Then you see an orange cat in the yard and practise: 'Look, a cat!' — English is a word game you play every day. 🐱", summary: "Red, blue, cat, dog, one-two-three, hello! Say it loud and proud.", keywords: ["red", "blue", "colour", "color", "cat", "dog", "animal", "one", "two", "number", "hello", "good morning", "eye", "hand", "body", "bird", "fish", "apple"],
    worked: "Worked example: 'Bird' in Indonesian is … Step 1: remember the animal group — a bird can fly and sing. 🐦 Step 2: cat = kucing, dog = anjing, fish = ikan — none of them is a bird. Step 3: so 'bird' = BURUNG!",
    vocab: "🔴 red = merah\n🔵 blue = biru\n🟡 yellow = kuning\n🟢 green = hijau\n🐱 cat = kucing\n🐶 dog = anjing\n🐦 bird = burung\n🐟 fish = ikan\n🍎 apple = apel\n👋 hello = halo",
    fact: "Did you know? Young children learn new languages much faster than adults, because a child's brain soaks up sounds like a sponge. Singing English songs while dancing is a great way to learn! 🎵",
    reading: { title: "Little Reading: My Cat Momo", text: "This is Momo. Momo is a cat. Momo is white. Momo likes fish. Momo says: meow!", qa: [
      { q: "What animal is Momo?", a: "A cat. 🐱" },
      { q: "What colour is Momo?", a: "White. ⚪" },
      { q: "What does Momo like to eat?", a: "Fish. 🐟" },
    ] } },
  "mat-tk-hitung": { title: "Fun Counting 1–20 & Shapes Around Us", concept: "Let's count while pointing at things one by one: 1 ☝️, 2, 3, 4, 5, 6, 7, 8, 9, 10, then 11 to 20! Touch each object so none is skipped or counted twice. Which is MORE? Match them one-to-one: the group with leftovers has more. 🟰 THE SAME means they match exactly. Shapes around us: circle ⭕ like a wheel and a plate, triangle 🔺 like a roof, square ⬛ like a floor tile. Fun patterns: 🔴🔵🔴🔵 … after blue comes red again!", example: "On the table there are 4 spoons and 6 forks. Match one spoon with one fork: 2 forks are left over, so there are MORE forks than spoons. You compared numbers without counting out loud! 🍴", summary: "Count while pointing one by one. More = leftovers when matched. Circles, triangles and squares are everywhere!", keywords: ["how many", "count", "next number", "before", "more", "fewer", "same", "shape", "circle", "triangle", "square", "pattern"],
    worked: "Worked example: There are 🍓🍓🍓🍓🍓 strawberries. How many are there? Step 1: point one by one while counting: one, two, three, four, five. Step 2: the last strawberry you touched is the fifth. Step 3: so there are 5 strawberries. 🍓",
    vocab: "🔢 count = say numbers while pointing at objects\n➕ more = a bigger amount\n➖ fewer = a smaller amount\n🟰 the same = exactly matching amounts\n⭕ circle = a round shape with no corners\n🔺 triangle = a shape with three corners",
    fact: "Did you know? You have 10 fingers — that is why humans count in base ten! Long ago, people counted with fingers, pebbles, and bamboo sticks. 🖐️" },
  "sains-benda-sekitar": { title: "Objects Around Me: Properties & Uses", concept: "Every object has properties: a stone is HARD, cotton is SOFT, sandpaper is ROUGH, silk is SMOOTH. Objects are made from materials that suit their job: umbrellas from waterproof material, pans from heat-proof metal, pillows from soft cloth and cotton. Some objects FLOAT on water (leaves, corks, plastic balls) and some SINK (stones, coins, metal spoons). Guess first, then prove it with a basin of water — just like a little scientist! 🔬", example: "A metal spoon sinks, but a plastic spoon floats. A huge steel ship floats because its shape is hollow like a giant bowl! 🚢", summary: "Hard–soft, rough–smooth. Materials are chosen for the job. Float or sink? Guess, then test!", keywords: ["hard", "soft", "rough", "smooth", "object", "wood", "plastic", "glass", "cloth", "wet", "dry", "float", "sink"],
    worked: "Worked example: Which object sinks in water? Step 1: remember the basin experiment — leaves and corks float. Step 2: a metal coin is heavy and solid. Step 3: so the coin SINKS. 🪙",
    vocab: "🪨 hard = difficult to press or shape (stone, wood)\n☁️ soft = squishy and easy to press (cotton, pillow)\n🌊 float = stay on the surface of water\n⚓ sink = go down to the bottom\n🧲 material = what an object is made of",
    fact: "Did you know? Ice floats on water — unlike most things that freeze and sink. Because ice floats, fish in a frozen lake can stay alive underneath it! 🧊" },
  "sains-siklus-air": { title: "The Water Cycle & Weather", concept: "Water on Earth travels in a never-ending WATER CYCLE: (1) EVAPORATION — water from seas, lakes and rivers turns into vapour because of the Sun's heat; (2) CONDENSATION — the vapour rises, cools, and becomes tiny droplets that form clouds; (3) PRECIPITATION — the droplets join, grow, and fall as rain (or snow where it is very cold); (4) the rain collects in rivers and seas again — the cycle repeats. Weather is the state of the air for a short time (sunny, cloudy, rainy, windy), while seasons are long weather patterns. A rainbow appears when sunlight passes through leftover raindrops. 🌈", example: "Wet laundry dries because of evaporation — the water does not disappear, it becomes vapour, rises into the sky, and may fall as rain in another city next week!", summary: "Evaporation → condensation (clouds) → precipitation (rain) → collect again. Water never disappears, it just travels.", keywords: ["water cycle", "evaporation", "condensation", "precipitation", "cloud", "rain", "weather", "season", "wind", "rainbow"],
    worked: "Worked example: Rising water vapour that turns into clouds undergoes … Step 1: clouds form from cooling vapour. Step 2: gas changing into liquid is called condensation. Step 3: so the answer is CONDENSATION. ☁️",
    vocab: "💨 evaporation = water turning into vapour by heat\n☁️ condensation = vapour turning into droplets (clouds)\n🌧️ precipitation = water falling from clouds (rain/snow)\n🌡️ weather = the state of the air right now\n🔄 cycle = a repeating journey",
    fact: "Did you know? The water you drink today may be the same water a dinosaur drank millions of years ago — Earth's water is always recycled and never increases or decreases! 🦕" },
  "sains-cahaya-bunyi": { title: "Light & Sound Around Us", concept: "Light travels in a STRAIGHT line — that is why objects blocking light make SHADOWS. Clear objects (glass) let light pass; dark objects (wood, cardboard) block it. Mirrors reflect light neatly so we can see ourselves; light can also bend (refract), which is why a spoon looks broken in a glass of water. Sound is born from VIBRATIONS: guitar strings vibrate, drums vibrate, our vocal cords vibrate too. Sound travels through air, water and solids — but NOT through empty space. Sound bouncing off a far wall makes an ECHO.", example: "Shout at a cliff and hear your voice come back? That is an echo — reflected sound. Astronauts on the Moon cannot hear each other without radios because there is no air there! 🌕", summary: "Light travels straight and is reflected by mirrors. Sound comes from vibrations and needs a medium to travel.", keywords: ["light", "shadow", "mirror", "reflect", "sound", "vibration", "echo", "rainbow", "lens", "voice"],
    worked: "Worked example: We can see our face in a mirror because light is … Step 1: light from our face travels to the mirror. Step 2: the mirror's smooth surface sends the light back to our eyes. Step 3: so light is REFLECTED by the mirror. 🪞",
    vocab: "🌑 shadow = the dark area behind an object blocking light\n🪞 reflection = light bouncing back from a surface\n〰️ vibration = the back-and-forth movement that makes sound\n📣 echo = reflected sound heard again\n🔍 refraction = light bending when it changes medium",
    fact: "Did you know? Light is the fastest thing in the universe: 300,000 kilometres per second! Sunlight takes only about 8 minutes to reach Earth. ☀️" },
  "sains-makanan-sehat": { title: "Healthy Food & The Digestive System", concept: "Our body is like a machine that needs fuel and building materials. CARBOHYDRATES (rice, bread, potatoes) give energy; PROTEIN (eggs, fish, meat, tofu, tempeh) builds and repairs the body; FATS store energy reserves; VITAMINS & MINERALS (vegetables and fruit) guard our health; WATER helps every process. Food is digested step by step: mouth (teeth chew + saliva), food pipe, stomach (churned with enzymes), small intestine (food essence is absorbed into the blood — this is where food truly 'enters' the body), large intestine (water is absorbed), and waste is removed. A healthy plate: half vegetables and fruit, the rest staple food and protein dishes. 🍽️", example: "A breakfast of rice + egg + spinach + milk gives a complete package: energy from rice, protein from egg and milk, vitamins from spinach. Your body is ready to learn all morning!", summary: "Carbohydrates = energy, protein = builder, vitamins = guard. Food essence is absorbed in the small intestine.", keywords: ["digestion", "food", "nutrition", "protein", "carbohydrate", "vitamin", "intestine", "digestive enzyme", "healthy", "mineral"],
    worked: "Worked example: Food essence is absorbed into the blood in the … Step 1: follow the food's journey — mouth, food pipe, stomach, then intestines. Step 2: the stomach only churns and mixes enzymes; it does not absorb essence yet. Step 3: absorption happens in the SMALL INTESTINE. ✅",
    vocab: "⚡ carbohydrate = energy-giving nutrient (rice, bread)\n🧱 protein = body-building nutrient (eggs, fish, tempeh)\n🛡️ vitamin = health-guarding nutrient (vegetables, fruit)\n🍽️ digestion = processing food into essence\n🌀 small intestine = where food essence is absorbed",
    fact: "Did you know? If your small intestine were spread out flat, its surface would cover a tennis court! Its folds and tiny bumps (villi) make absorbing food super efficient. 🎾" },
  "mat-statistika": { title: "Statistics: Charts, Mean, Median & Mode", concept: "Statistics is how we read collections of data. Three key measures: (1) MEAN = total of all data ÷ how many data points; (2) MEDIAN = the middle value after sorting; (3) MODE = the value that appears most often. Data is shown in bar charts (comparing amounts), line charts (changes over time), pie charts (parts of a whole), and pictograms (pictures stand for amounts — check the key!). Classic trap: the mean of two groups cannot simply be averaged — go back to the totals first.", example: "Test scores of 6 students: 70, 80, 80, 90, 100, 80. The mode is 80 (appears 3 times), the median is 80 (middle value), and the mean is (70+80+80+90+100+80) ÷ 6 = 500 ÷ 6 ≈ 83.3.", summary: "Mean = total ÷ count. Median = middle value when sorted. Mode = most frequent.", keywords: ["mean", "average", "chart", "median", "mode", "data", "pictogram", "graph"],
    worked: "Worked example: The mean of 70, 80, 90, 100 is … Step 1: add them all: 70 + 80 + 90 + 100 = 340. Step 2: count the data: there are 4 values. Step 3: divide: 340 ÷ 4 = 85. So the mean is 85. ✅",
    vocab: "📊 data = a collection of facts/numbers\n➗ mean = total of data ÷ number of data\n🎯 median = the middle value after sorting\n🔁 mode = the most frequent value\n🖼️ pictogram = a chart using pictures with a key",
    fact: "Did you know? The word 'statistics' comes from 'state' — rulers once collected data about their people to run their kingdoms. Now statistics is used everywhere, from weather to football! ⚽" },
  "ing-reading-sd": { title: "Reading Time: Short Stories & Questions", concept: "Reading in English is easier than you think! Follow these steps: (1) read the title and guess what the story is about; (2) read the whole text slowly — do not stop at every new word; (3) find WHO (the characters), WHERE (the place), and WHAT HAPPENS; (4) answer the questions by looking back at the text — the answers are hidden inside the sentences! Useful question words: who, what, where, when, why.", example: "After reading a short story, close the book and retell it in your own words: 'The story is about a rabbit. The rabbit is fast but lazy…' If you can retell it, you truly understand it!", summary: "Title → read → who/where/what happens → find answers in the text.", keywords: ["reading", "story", "read", "passage", "question"],
    worked: "Worked example: read 'Benny the Rabbit' below, then answer: What does Benny like to eat? Step 1: read the whole text. Step 2: find the sentence about food — 'He likes carrots and leaves.' Step 3: so the answer is CARROTS (and leaves). 🥕",
    vocab: "📖 reading = membaca\n🧑 character = tokoh cerita\n🏞️ place = tempat kejadian\n❓ question words = who, what, where, when, why\n🔎 look back = melihat kembali ke teks\n🥕 carrot = wortel",
    fact: "Did you know? A 'bookworm' is someone who loves reading — and real bookworms are tiny insects that eat old book pages! 📚",
    reading: { title: "Benny the Rabbit", text: "Benny is a small white rabbit. He lives in a garden near a big mango tree. Every morning, Benny hops around the garden. He likes carrots and leaves. One day, Benny meets a turtle. The turtle walks slowly, but Benny hops fast. 'Let us be friends,' says Benny. Now Benny and the turtle play together every day.", qa: [
      { q: "What colour is Benny?", a: "White." },
      { q: "Where does Benny live?", a: "In a garden near a big mango tree." },
      { q: "Who is Benny's new friend?", a: "A turtle." },
    ] } },
  "ing-reading-smp": { title: "Reading Comprehension: Main Idea & Inference", concept: "Strong readers do three things: (1) find the MAIN IDEA — the point every sentence supports, often in the first or last sentence of a paragraph; (2) separate FACT from OPINION — facts can be proven, opinions show feelings or judgement; (3) make INFERENCES — conclusions the writer suggests but does not state directly ('She grabbed an umbrella' → it was probably raining). Skim first for the big picture, then scan for details. Comprehension questions are answered FROM the text, not from your own experience.", example: "A text says: 'Rafi saved his money for six months. Last Saturday, he finally bought the bicycle.' Inference: Rafi is patient and determined — the writer never says it, but the clues prove it. 🚲", summary: "Main idea = the supported point. Fact ≠ opinion. Inference = clues + reasoning.", keywords: ["reading", "passage", "main idea", "inference", "comprehension"],
    worked: "Worked example: read the passage below and choose its main idea. Step 1: skim all sentences. Step 2: ask 'what do all these sentences support?' — every sentence is about libraries helping people learn. Step 3: so the main idea is: libraries open the world of knowledge to everyone. ✅",
    vocab: "💡 main idea = gagasan utama\n✔️ fact = a statement that can be proven\n💭 opinion = a personal judgement\n🔎 inference = a conclusion from clues\n👀 skim = read quickly for the big picture\n🎯 scan = search for specific details",
    fact: "Did you know? The longest sentence ever printed in a novel has more than 13,000 words — readers needed many bookmarks for just one sentence! 😲",
    reading: { title: "Libraries Open the World", text: "A library is far more than a room full of books. Inside a library, a student can travel to ancient Egypt through a history book, explore the deep sea through a science magazine, or learn a new language from a dictionary — all without leaving the chair. Libraries also teach independence: visitors learn to search, choose, and judge information by themselves. That is why great nations take care of their libraries. Books may be silent, but the minds they build travel far beyond the walls.", qa: [
      { q: "What is the main idea of the passage?", a: "Libraries open the world of knowledge to everyone (and train independence) — every sentence supports this point." },
      { q: "According to the text, what do libraries teach besides knowledge?", a: "Independence: visitors learn to search, choose, and judge information by themselves." },
      { q: "Is 'Books may be silent, but the minds they build travel far' a fact or an opinion? Why?", a: "An opinion — it is the writer's figurative judgement, not something that can be proven with data." },
    ] } },
  "kor-tk-salam": { title: "Fun Korean: Greetings & Numbers 1–10", concept: "Let's greet in Korean! 👋 안녕하세요 (annyeonghaseyo) = hello! 감사합니다 (gamsahamnida) = thank you. 안녕히 가세요 (annyeonghi gaseyo) = see you! 🔢 Native Korean numbers 1–10: 하나 (hana) 1, 둘 (dul) 2, 셋 (set) 3, 넷 (net) 4, 다섯 (daseot) 5, 여섯 (yeoseot) 6, 일곱 (ilgop) 7, 여덟 (yeodeol) 8, 아홉 (ahop) 9, 열 (yeol) 10. 🐶 Animals: 개 (gae) = dog, 고양이 (goyangi) = cat. Say them while clapping to the rhythm!", example: "While watching a Korean cartoon with your sibling, you greet the character: 'Annyeonghaseyo!' It feels like having a new friend from a faraway country. 🇰🇷", summary: "Annyeonghaseyo = hello, gamsahamnida = thank you. Hana, dul, set = 1, 2, 3!", keywords: ["annyeong", "hello", "thank you", "number", "hana", "one", "colour", "animal", "korean"],
    worked: "Worked example: 'One' in Korean is … Step 1: count with the song: hana … Step 2: hana is the very first number we sing. Step 3: so one = 하나 (hana)! 🎵",
    vocab: "👋 안녕하세요 (annyeonghaseyo) = hello\n🙏 감사합니다 (gamsahamnida) = thank you\n1️⃣ 하나 (hana) = one\n2️⃣ 둘 (dul) = two\n3️⃣ 셋 (set) = three\n🐶 개 (gae) = dog",
    fact: "Did you know? The Korean alphabet is called Hangul and was created by a kind king, King Sejong, so that all his people could learn to read! 👑" },
  "jpn-tk-salam": { title: "Fun Japanese: Greetings & Numbers 1–10", concept: "Let's greet in Japanese! 👋 こんにちは (konnichiwa) = hello! おはよう (ohayou) = good morning. ありがとう (arigatou) = thank you. さようなら (sayounara) = goodbye! 🔢 Japanese numbers 1–10: 一 ichi 1, 二 ni 2, 三 san 3, 四 yon 4, 五 go 5, 六 roku 6, 七 nana 7, 八 hachi 8, 九 kyuu 9, 十 juu 10. 🐱 Animals: ねこ (neko) = cat, いぬ (inu) = dog, さかな (sakana) = fish. In Japan, people bow a little when greeting — a sign of politeness. 🎎", example: "In the morning at school you greet your teacher like a Japanese child: 'Ohayou!' with a little bow. Polite and fun! 🌸", summary: "Konnichiwa = hello, ohayou = good morning, arigatou = thank you. Ichi, ni, san = 1, 2, 3!", keywords: ["konnichiwa", "hello", "arigatou", "thank you", "number", "ichi", "one", "colour", "animal", "japanese"],
    worked: "Worked example: 'One' in Japanese is … Step 1: count from the start: ichi … Step 2: ichi is the first sound when counting. Step 3: so one = 一 (ichi)! 🎵",
    vocab: "👋 こんにちは (konnichiwa) = hello\n🌅 おはよう (ohayou) = good morning\n🙏 ありがとう (arigatou) = thank you\n1️⃣ 一 (ichi) = one\n2️⃣ 二 (ni) = two\n3️⃣ 三 (san) = three\n🐱 ねこ (neko) = cat",
    fact: "Did you know? Japan has a super-fast train called the Shinkansen that runs faster than a racing car — and is almost always on time! 🚄" },
  "man-tk-salam": { title: "Fun Mandarin: Greetings & Numbers 1–10", concept: "Let's greet in Mandarin! 👋 你好 (nǐ hǎo) = hello! 谢谢 (xièxie) = thank you. 再见 (zàijiàn) = see you! 🔢 Mandarin numbers 1–10: 一 yī 1, 二 èr 2, 三 sān 3, 四 sì 4, 五 wǔ 5, 六 liù 6, 七 qī 7, 八 bā 8, 九 jiǔ 9, 十 shí 10. While counting, move your fingers like the number shapes: one finger for yī, two fingers for èr! 🐱 Animals: 猫 (māo) = cat, 狗 (gǒu) = dog, 鱼 (yú) = fish.", example: "At the market, you greet a fruit seller: 'Nǐ hǎo!' She smiles widely. One hello can start a new friendship. 🍊", summary: "Nǐ hǎo = hello, xièxie = thank you. Yī, èr, sān = 1, 2, 3!", keywords: ["ni hao", "hello", "xiexie", "thank you", "number", "yi", "one", "colour", "animal", "mandarin"],
    worked: "Worked example: 'One' in Mandarin is … Step 1: count while raising fingers: yī … Step 2: yī is the first number we say. Step 3: so one = 一 (yī)! 🎵",
    vocab: "👋 你好 (nǐ hǎo) = hello\n🙏 谢谢 (xièxie) = thank you\n1️⃣ 一 (yī) = one\n2️⃣ 二 (èr) = two\n3️⃣ 三 (sān) = three\n🐱 猫 (māo) = cat\n🐼 熊猫 (xióngmāo) = panda",
    fact: "Did you know? Giant pandas come from China and almost all of their food is bamboo — a panda can eat bamboo for 12 hours a day! 🐼" },
};

/* ================= MATERI DASAR (fallback "i") — Bahasa Inggris ================= */
export const MATERIALS_EN: Record<string, { title: string; sections: { h: string; body: string }[] }> = {
  matematika: { title: "Mathematics — Materials in English (Cambridge)", sections: [
    { h: "Numbers & Operations", body: "Work in order: brackets, multiplication/division, then addition/subtraction. Two negative signs multiply to a positive." },
    { h: "Fractions & Patterns", body: "Add fractions with equal denominators; the LCM helps make them equal. Arithmetic patterns add a constant difference." },
    { h: "Geometry & Algebra", body: "Circle area = πr²; Pythagoras c² = a² + b². Solve equations by keeping both sides balanced." },
  ] },
  sains: { title: "Science — Materials in English (Cambridge)", sections: [
    { h: "Living Things", body: "Producers make food by photosynthesis; consumers eat; decomposers recycle. Cells are the smallest unit of life." },
    { h: "Energy & Forces", body: "Speed = distance ÷ time. Gravity pulls objects to Earth; friction opposes motion." },
    { h: "Earth & Matter", body: "Eight planets orbit the Sun. pH below 7 is acidic, 7 neutral, above 7 basic." },
  ] },
  biologi: { title: "Biology — Materials in English (Cambridge)", sections: [
    { h: "Cells & Energy", body: "Mitochondria produce ATP; most ATP comes from the electron transport chain." },
    { h: "Genetics", body: "Dominant traits mask recessive ones; dihybrid crosses give 9:3:3:1." },
  ] },
  fisika: { title: "Physics — Materials in English (Cambridge)", sections: [
    { h: "Motion", body: "v = s/t; free fall v = g·t with g ≈ 10 m/s²; Newton II: F = m·a." },
    { h: "Energy & Electricity", body: "KE = ½mv²; Ohm's law V = I·R; wave speed v = f·λ." },
  ] },
  kimia: { title: "Chemistry — Materials in English (Cambridge)", sections: [
    { h: "Elements", body: "Symbols: Na sodium, Fe iron, Au gold. Fe (Z=26) = [Ar] 4s² 3d⁶." },
    { h: "Acids & Buffers", body: "pH = −log[H⁺]. Buffers pair a weak acid with its conjugate base." },
  ] },
  ips: { title: "Social Studies — Materials in English (Cambridge)", sections: [
    { h: "Geography", body: "Kalimantan (Borneo) is one of the world's largest islands; each province has a capital city." },
    { h: "Economy", body: "Inflation is a general rise in prices; Indonesia's currency is the Rupiah." },
  ] },
  sejarah: { title: "History — Materials in English (Cambridge)", sections: [
    { h: "Kingdoms", body: "Sriwijaya ruled the Malacca Strait; Majapahit peaked under Hayam Wuruk and Gajah Mada." },
    { h: "Towards Independence", body: "Budi Utomo 1908, Youth Pledge 1928, Proclamation 17 August 1945." },
  ] },
  informatika: { title: "Computing — Materials in English (Cambridge)", sections: [
    { h: "Basics", body: "CPU is the brain; keyboard/mouse are input; monitor/printer are output." },
    { h: "Staying Safe", body: "Strong passwords mix letters, numbers, and symbols — never share them." },
  ] },
  inggris: { title: "English — Materials in English (Cambridge)", sections: [
    { h: "Grammar", body: "Simple present adds -s/-es for he/she/it; passive voice = be + past participle." },
    { h: "Vocabulary", body: "Learn opposites and irregular plurals: child–children, foot–feet." },
  ] },
  korea: { title: "Korean — Materials in English (Cambridge)", sections: [
    { h: "Hangul", body: "Hangul has 24 basic letters, created by King Sejong. Korean sentences are SOV." },
  ] },
  jepang: { title: "Japanese — Materials in English (Cambridge)", sections: [
    { h: "Scripts", body: "Hiragana for native words, katakana for foreign words, kanji for meaning." },
  ] },
  mandarin: { title: "Mandarin — Materials in English (Cambridge)", sections: [
    { h: "Tones", body: "Mandarin has 4 tones; 吗 (ma) makes questions, 的 (de) shows possession." },
  ] },
  "cambridge-eng": { title: "Cambridge English — Materials", sections: [
    { h: "Grammar", body: "Passive = be + past participle; present perfect = have + past participle." },
  ] },
  "cambridge-sci": { title: "Cambridge Science — Materials", sections: [
    { h: "Key Ideas", body: "Plants photosynthesise; magnets attract iron; elements have symbols." },
  ] },
  "cambridge-math": { title: "Cambridge Maths — Materials", sections: [
    { h: "Key Skills", body: "Practise operations, fractions, and word problems step by step." },
  ] },
};

/* ================= DISPATCHER GENERATOR — Bahasa Inggris ================= */
/** Padanan generateQuestions() untuk mode Cambridge: mengambil dari
    GENERATORS_EN dengan aturan keunikan yang sama (teks soal dulu,
    lalu variasi set pilihan). */
export function generateQuestionsEn(jenjang: JenjangId, subjectId: string, level: number, want: number): Question[] {
  const gens = GENERATORS_EN[jenjang]?.[subjectId] ?? [];
  if (!gens.length) return [];
  const out: Question[] = [];
  const pending: Question[] = [];
  const seenQ = new Set<string>();
  const seenFull = new Set<string>();
  let guard = 0;
  const maxGuard = want * 80;
  while (out.length < want && guard < maxGuard) {
    guard++;
    const g = gens[ri(0, gens.length - 1)];
    if (!g) break;
    const q = g(level);
    if (!q) continue;
    const full = `${q.q}|${[...q.options].sort().join("|")}`;
    if (seenFull.has(full)) continue;
    seenFull.add(full);
    if (seenQ.has(q.q)) {
      pending.push(q);
    } else {
      seenQ.add(q.q);
      out.push(q);
    }
  }
  for (const q of pending) {
    if (out.length >= want) break;
    out.push(q);
  }
  return out;
}

/* ================= MODUL & MATERI — bentuk untuk library.ts ================= */
/** Terapkan terjemahan MODULE_EN ke modul Perpustakaan (bila ada).
    Kolom pengayaan (worked/vocab/fact/reading) ikut dari entri EN: bila
    entri EN tidak menyediakan terjemahannya, kolom itu dikosongkan agar
    teks Bahasa Indonesia tidak bocor ke tampilan Cambridge. */
export function englishModule(mod: LibraryModule): LibraryModule {
  const en = MODULE_EN[mod.id];
  if (!en) return mod;
  return {
    ...mod,
    title: en.title, concept: en.concept, example: en.example, summary: en.summary, keywords: en.keywords,
    worked: en.worked, vocab: en.vocab, fact: en.fact, reading: en.reading,
  };
}

/** Terapkan terjemahan MATERIALS_EN ke materi fallback (bila ada). */
export function englishMaterial(subjectId: string, mat: Material): Material {
  const en = MATERIALS_EN[subjectId];
  if (!en) return mat;
  return {
    ...mat,
    title: en.title,
    sections: mat.sections.map((s, i) => {
      const es = en.sections[i];
      return es ? { h: es.h, body: es.body } : s;
    }),
  };
}
