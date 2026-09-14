import {
  TerrainTarget,
  PioneerFamilyBadge,
  EarlyRoadDistance,
  HistoricalAct
} from '../types';

export const PIKE_CENTER_COORDS = {
  latitude: 38.4912,
  longitude: -87.2798
};

export const INITIAL_HISTORICAL_TARGETS: TerrainTarget[] = [
  {
    id: 'target-pride-1807',
    name: 'Woolsey Pride 1807 Blockhouse Fort',
    category: 'blockhouse_fort',
    township: 'Washington',
    yearSettled: 1800,
    latitude: 38.4942,
    longitude: -87.2735,
    elevationMeters: 154,
    dimensionsFeet: '32 ft × 24 ft (Double-walled)',
    goodspeedCitation: 'Goodspeed (1885), pp. 251, 274, 335',
    goodspeedPage: 251,
    pioneerFamily: 'Pride Family (Woolsey & William)',
    chronicleSummary: 'First white settlement in Pike County (1800) at White Oak Springs. In 1807, during rising Indian tensions prior to the War of 1812, Pride erected the fortified two-story hewed-log blockhouse where early families gathered for defense.',
    verificationStatus: 'unverified',
    citationVerified: false,
  },
  {
    id: 'target-brenton-1817',
    name: 'Peter Brenton 1817 Log Courthouse & Jail Site',
    category: 'cellar_hole',
    township: 'Washington',
    yearSettled: 1817,
    latitude: 38.4908,
    longitude: -87.2782,
    elevationMeters: 148,
    dimensionsFeet: '32 ft × 24 ft Courthouse; 20 ft Jail',
    goodspeedCitation: 'Goodspeed (1885), pp. 277, 336, 341',
    goodspeedPage: 277,
    pioneerFamily: 'Brenton Family (Peter & James)',
    chronicleSummary: 'Peter Brenton donated the 112-acre parcel establishing Petersburg in 1817. Built of hewed logs by Thomas C. Stewart ($599.75). Adjacent jail had double walls filled with upright timbers.',
    verificationStatus: 'unverified',
    citationVerified: false,
  },
  {
    id: 'target-miley-mill-1824',
    name: 'Henry Miley 1824 Two-Horse Grist Mill',
    category: 'mill_race',
    township: 'Washington',
    yearSettled: 1824,
    latitude: 38.4865,
    longitude: -87.2685,
    elevationMeters: 139,
    dimensionsFeet: 'Mill basin 45 ft diam; 180 ft race',
    goodspeedCitation: 'Goodspeed (1885), pp. 251, 255-256',
    goodspeedPage: 255,
    pioneerFamily: 'Miley Family (Henry & David)',
    chronicleSummary: 'The first mill in Pike County. A two-horse mill processing 35 bushels per day. Pioneers came from 20 miles away and camped outside for 36 hours. Introduced the first bolting cloth in the county.',
    verificationStatus: 'unverified',
    citationVerified: false,
  },
  {
    id: 'target-youngman-distillery',
    name: 'John Youngman 1826 Copper Distillery & Pit',
    category: 'cellar_hole',
    township: 'Washington',
    yearSettled: 1826,
    latitude: 38.4828,
    longitude: -87.2842,
    elevationMeters: 142,
    dimensionsFeet: '28 ft × 20 ft cellar; 12 ft still pit',
    goodspeedCitation: 'Goodspeed (1885), pp. 256, 343',
    goodspeedPage: 256,
    pioneerFamily: 'Youngman / Graham',
    chronicleSummary: 'Licensed to make 1 barrel/day at 10–12.5¢/gallon. Burned in 1831 during which streams of fiery liquor flowed down gullies while locals dipped straws into the rivulets.',
    verificationStatus: 'unverified',
    citationVerified: false,
  },
  {
    id: 'target-siple-mound',
    name: 'Siple Great Prehistoric Mound & Causeway',
    category: 'prehistoric_mound',
    township: 'Clay / Washington',
    yearSettled: 1820,
    latitude: 38.5,
    longitude: -87.31,
    elevationMeters: 168,
    dimensionsFeet: 'Base 150 ft × 90 ft; Height 35 ft',
    goodspeedCitation: 'Goodspeed (1885), pp. 271, 276',
    goodspeedPage: 276,
    pioneerFamily: 'Siple / Oborn / Stuckey',
    chronicleSummary: 'Massive earthen causeway mole projecting from bluffs over White River. In 1850s, excavators uncovered three giant skeletons with flat stone slabs resting on chest and head.',
    verificationStatus: 'unverified',
    citationVerified: false,
    locationRestricted: true,
  },
  {
    id: 'target-governors-trace',
    name: 'The Old Indian Trace (Governor’s Trace / Mud Hole)',
    category: 'historic_trace',
    township: 'Washington / Madison',
    yearSettled: 1801,
    latitude: 38.4795,
    longitude: -87.2610,
    elevationMeters: 145,
    dimensionsFeet: 'Sunken road bed 12–16 ft wide',
    goodspeedCitation: 'Goodspeed (1885), pp. 255, 270, 478',
    goodspeedPage: 255,
    pioneerFamily: 'Teverbaugh / Harrison / Tecumseh',
    chronicleSummary: 'Ancient buffalo and Native American trail from Vincennes to the Falls of Ohio. Renamed Governor’s Trace after Gen. William Henry Harrison traversed it. Mail was carried weekly on foot by George Teverbaugh.',
    verificationStatus: 'unverified',
    citationVerified: false,
  },
  {
    id: 'target-posey-shaft',
    name: 'Dr. John W. Posey Underground Railroad Coal Shaft',
    category: 'coal_drift',
    township: 'Washington',
    yearSettled: 1837,
    latitude: 38.5032,
    longitude: -87.2654,
    elevationMeters: 141,
    dimensionsFeet: 'Drift entry 8 ft × 6 ft; spoil bank 60 ft',
    goodspeedCitation: 'Goodspeed (1885), pp. 248, 269, 406',
    goodspeedPage: 269,
    pioneerFamily: 'Dr. John W. Posey',
    chronicleSummary: 'Dr. Posey, an ardent abolitionist, operated this coal adit along White River. In 1837 he secretly harbored two runaway slaves, Sam and an associate, inside the dark coal galleries before helping them escape North.',
    verificationStatus: 'unverified',
    citationVerified: false,
  },
  {
    id: 'target-hathaway-mill',
    name: 'John Hathaway 1837 Patoka Mill & Flatboat Slip',
    category: 'mill_race',
    township: 'Patoka',
    yearSettled: 1837,
    latitude: 38.3845,
    longitude: -87.2140,
    elevationMeters: 132,
    dimensionsFeet: 'Mill seat 40×35 ft; river slip 120 ft',
    goodspeedCitation: 'Goodspeed (1885), pp. 263, 354',
    goodspeedPage: 354,
    pioneerFamily: 'Hathaway (John & William W.)',
    chronicleSummary: 'Founder of Winslow. Built water mill below bridge site. In 1835 Capt. J. W. Cockrum loaded the first flatboat of pork here to float down Patoka and Wabash to New Orleans.',
    verificationStatus: 'unverified',
    citationVerified: false,
  },
  {
    id: 'target-snake-knob',
    name: 'Conrad LeMasters 1817 Homestead & Snake Knob',
    category: 'cellar_hole',
    township: 'Monroe / Lockhart',
    yearSettled: 1817,
    latitude: 38.3265,
    longitude: -87.2385,
    elevationMeters: 204,
    dimensionsFeet: 'Cellar 22×18 ft; 290 ft isolated knob',
    goodspeedCitation: 'Goodspeed (1885), pp. 261, 262',
    goodspeedPage: 262,
    pioneerFamily: 'LeMasters Family (Conrad & Simeon)',
    chronicleSummary: 'First settlement south of the Patoka (1815-1817). LeMasters, John Ferguson, and Park Bethell cleared an infamous rattlesnake den on the 290-ft high Snake Knob, killing 300 rattlesnakes in one autumn day.',
    verificationStatus: 'unverified',
    citationVerified: false,
  },
  {
    id: 'target-hosea-smith',
    name: 'Hosea Smith 1811 Survey Hub & Post Station',
    category: 'cellar_hole',
    township: 'Washington',
    yearSettled: 1811,
    latitude: 38.4880,
    longitude: -87.2710,
    elevationMeters: 151,
    dimensionsFeet: '24 ft × 20 ft cellar; 8 ft well ring',
    goodspeedCitation: 'Goodspeed (1885), pp. 251, 255, 336',
    goodspeedPage: 251,
    pioneerFamily: 'Smith Family (Hosea, Henry, Onias)',
    chronicleSummary: 'North Carolina pioneer who surveyed Petersburg, Portersville, and Jasper. First postmaster of the territory; kept mail inside his beaver-skin hat and delivered it when crossing neighbors on horseback.',
    verificationStatus: 'unverified',
    citationVerified: false,
  },
  {
    id: 'target-highbanks-bluff',
    name: 'Highbanks Escarpment & Judge Hammond Estate',
    category: 'cellar_hole',
    township: 'Jefferson',
    yearSettled: 1819,
    latitude: 38.5125,
    longitude: -87.1950,
    elevationMeters: 162,
    dimensionsFeet: '36 ft × 30 ft Manor foundation',
    goodspeedCitation: 'Goodspeed (1885), pp. 253, 355',
    goodspeedPage: 253,
    pioneerFamily: 'Hammond / McCain / Hargrave',
    chronicleSummary: 'Founded by Pride and McCains in 1813. In 1819 Judge Hammond arrived from Massachusetts with wagons of glass windows from Pittsburgh; crowds of pioneers flocked from across the county to gaze at real glass sash.',
    verificationStatus: 'unverified',
    citationVerified: false,
  },
  {
    id: 'target-ayrshire-coal',
    name: 'Ayrshire Pioneer Coal Adit & Beehive Coke Kilns',
    category: 'coal_drift',
    township: 'Patoka',
    yearSettled: 1879,
    latitude: 38.4120,
    longitude: -87.1850,
    elevationMeters: 158,
    dimensionsFeet: 'Eight 14 ft circular kilns; railway cut',
    goodspeedCitation: 'Goodspeed (1885), pp. 248, 270, 427',
    goodspeedPage: 427,
    pioneerFamily: 'Lauder / Ingle / Cockrum',
    chronicleSummary: 'Superintendent Robert Lauder tested Pike County Coal K block coal and proved its superior quality for iron smelting. Constructed eight primitive brick beehive coke furnaces in the ravine.',
    verificationStatus: 'unverified',
    citationVerified: false,
  }
];

export const PIONEER_FAMILY_BADGES: PioneerFamilyBadge[] = [
  {
    id: 'badge-pride',
    familyName: 'Pride',
    patriarch: 'Woolsey & William Pride',
    arrivalYear: 1800,
    township: 'Washington (White Oak Springs)',
    landAcres: 320,
    militaryService: 'Ranger & Blockhouse Commander',
    historicalSignificance: 'Erected the first defensive block-house fort in Pike County (1807) to guard settlers against Tecumseh’s confederated warriors.',
    quoteExcerpt: 'The first settlement made in the county was at White Oak Springs, in 1800, by Woolsey Pride. Here he built a block-house, about 1807.',
    goodspeedPage: 251,
    iconName: 'Shield'
  },
  {
    id: 'badge-brenton',
    familyName: 'Brenton',
    patriarch: 'Peter & James Brenton',
    arrivalYear: 1807,
    township: 'Washington',
    landAcres: 440,
    militaryService: 'Militia Soldier, War of 1812',
    historicalSignificance: 'Peter Brenton donated 112 acres of prime rolling land in 1817 to establish the permanent county seat of Petersburg.',
    quoteExcerpt: 'In honor of the principal donor, Peter Brenton... the seat of justice on a donation of land made to the county by Peter Brenton, Henry Miley, Sr., and John Coonrod.',
    goodspeedPage: 336,
    iconName: 'Landmark'
  },
  {
    id: 'badge-miley',
    familyName: 'Miley',
    patriarch: 'Henry & David Miley',
    arrivalYear: 1802,
    township: 'Washington',
    landAcres: 360,
    militaryService: 'Frontier Militia',
    historicalSignificance: 'Built the first two-horse grist mill in Pike County (1824) and installed the first bolting cloth, revolutionizing pioneer breadmaking.',
    quoteExcerpt: 'The first mill of this township, and even in the county, was built by Henry Miley in 1824... patrons would have to wait thirty-six hours for their grist.',
    goodspeedPage: 255,
    iconName: 'Cog'
  },
  {
    id: 'badge-smith',
    familyName: 'Smith',
    patriarch: 'Hosea Smith',
    arrivalYear: 1811,
    township: 'Washington & White Oak Springs',
    landAcres: 280,
    historicalSignificance: 'Chief surveyor of Petersburg (1817) and Portersville (1818), first postmaster carrying letters in his hat, justice of peace, and merchant.',
    quoteExcerpt: 'The first postoffice was kept by Hosea Smith at the Springs, about 1811. Smith was postmaster, surveyor, justice of the peace, merchant and farmer.',
    goodspeedPage: 251,
    iconName: 'Compass'
  },
  {
    id: 'badge-posey',
    familyName: 'Posey',
    patriarch: 'Dr. John W. Posey',
    arrivalYear: 1830,
    township: 'Washington (Petersburg)',
    landAcres: 300,
    militaryService: 'Surgeon, Battle of Shiloh & Field Hospital',
    historicalSignificance: 'Famous physician, pioneer coal operator, and abolitionist conductor who hid runaway slaves in the Posey Coal Shaft in 1837.',
    quoteExcerpt: 'He was one of the first to champion the cause of the slave, and his house was known as a station on the underground railroad.',
    goodspeedPage: 406,
    iconName: 'Flame'
  },
  {
    id: 'badge-lemasters',
    familyName: 'LeMasters',
    patriarch: 'Conrad & Simeon LeMasters',
    arrivalYear: 1817,
    township: 'Monroe & Lockhart',
    landAcres: 240,
    historicalSignificance: 'First settler south of the Patoka River; famous hunter who cleared the 290-ft Snake Knob of 300 rattlesnakes in 1818.',
    quoteExcerpt: 'LeMasters once discovered a genuine snake den on Snake Knob, a hill 290 feet high... He opened the den and killed 300 rattlesnakes.',
    goodspeedPage: 262,
    iconName: 'Mountain'
  },
  {
    id: 'badge-youngman',
    familyName: 'Youngman',
    patriarch: 'John Youngman',
    arrivalYear: 1826,
    township: 'Washington',
    landAcres: 120,
    historicalSignificance: 'Operated the famous 1826 copper distillery on Pride’s Creek; 1831 conflagration became legendary when whiskey flooded town gullies.',
    quoteExcerpt: 'In 1826 John Youngman built a mill and copper distillery... In 1831 it was burned with a large quantity of whisky.',
    goodspeedPage: 256,
    iconName: 'Droplet'
  },
  {
    id: 'badge-hathaway',
    familyName: 'Hathaway',
    patriarch: 'John & William Winslow Hathaway',
    arrivalYear: 1837,
    township: 'Patoka (Winslow)',
    landAcres: 210,
    historicalSignificance: 'Founder of the town of Winslow on the Patoka River; built first river mill where flatboats loaded with cured pork departed for New Orleans.',
    quoteExcerpt: 'Winslow was laid out November 14, 1837, by John Hathaway... owning a mill on the river just below the town.',
    goodspeedPage: 354,
    iconName: 'Anchor'
  }
];

export const EARLY_ROAD_DISTANCES: EarlyRoadDistance[] = [
  {
    fromLocation: 'Vincennes (Post Ouabache)',
    toLocation: 'Decker’s Ferry (White River)',
    miles: 9,
    historicalRouteName: 'Old Indian Trace / Governor’s Trace',
    terrainDescription: 'Sandy alluvial floodplain crossing ancient river bars and cane-brakes.'
  },
  {
    fromLocation: 'Decker’s Ferry',
    toLocation: 'White Oak Springs (Petersburg)',
    miles: 4,
    historicalRouteName: 'Governor’s Trace',
    terrainDescription: 'Ascends 120-foot river bluffs through dense white oak and tulip poplar forest.'
  },
  {
    fromLocation: 'White Oak Springs',
    toLocation: 'Mud Holes (Near Ireland, Dubois Co.)',
    miles: 14,
    historicalRouteName: 'Mud Hole Trace',
    terrainDescription: 'Treacherous glacial clay sloughs that frequently bogged ox wagons to the hubs.'
  },
  {
    fromLocation: 'Mud Holes',
    toLocation: 'French Lick Springs',
    miles: 22,
    historicalRouteName: 'Governor’s Trace',
    terrainDescription: 'Rugged subcarboniferous sandstone gorges and mineral sulfur springs.'
  },
  {
    fromLocation: 'French Lick Springs',
    toLocation: 'Paoli (Orange County Courthouse)',
    miles: 9,
    historicalRouteName: 'Vincennes-Louisville Highway',
    terrainDescription: 'High limestone karst terrain and sinkhole ridges.'
  },
  {
    fromLocation: 'Paoli',
    toLocation: 'Falls of the Ohio (Louisville / Clarksville)',
    miles: 41,
    historicalRouteName: 'Old Buffalo Trace (1787 Highway)',
    terrainDescription: 'Broad ancient migratory bison highway cut deep into the Knobstone escarpment.'
  }
];

import { ScanGridTile } from '../types';

export const INITIAL_GRID_TILES: ScanGridTile[] = [
  {
    id: 'grid-p-01',
    code: 'GRID-P-01',
    bounds: { north: 38.53, south: 38.48, west: -87.35, east: -87.30 },
    center: { lat: 38.505, lng: -87.325 },
    status: 'scanned',
    anomaliesFoundCount: 2,
    lastScannedTime: '4 hours ago',
    scanProgressPercent: 100
  },
  {
    id: 'grid-p-02',
    code: 'GRID-P-02 (Petersburg Core)',
    bounds: { north: 38.53, south: 38.48, west: -87.30, east: -87.25 },
    center: { lat: 38.505, lng: -87.275 },
    status: 'scanned',
    anomaliesFoundCount: 4,
    lastScannedTime: '2 hours ago',
    scanProgressPercent: 100
  },
  {
    id: 'grid-p-03',
    code: 'GRID-P-03 (Highbanks Bluff)',
    bounds: { north: 38.53, south: 38.48, west: -87.25, east: -87.20 },
    center: { lat: 38.505, lng: -87.225 },
    status: 'scanning',
    anomaliesFoundCount: 1,
    lastScannedTime: 'In progress',
    nextScheduledScanTime: 'Active now (Grokbot VM-02)',
    scanProgressPercent: 68
  },
  {
    id: 'grid-p-04',
    code: 'GRID-P-04 (Decker Ferry / White River)',
    bounds: { north: 38.53, south: 38.48, west: -87.20, east: -87.15 },
    center: { lat: 38.505, lng: -87.175 },
    status: 'queued',
    anomaliesFoundCount: 0,
    nextScheduledScanTime: 'In 3 hours (Queued #1)',
    scanProgressPercent: 0
  },
  {
    id: 'grid-p-05',
    code: 'GRID-P-05 (Washington Twp West)',
    bounds: { north: 38.48, south: 38.43, west: -87.35, east: -87.30 },
    center: { lat: 38.455, lng: -87.325 },
    status: 'scanned',
    anomaliesFoundCount: 1,
    lastScannedTime: '8 hours ago',
    scanProgressPercent: 100
  },
  {
    id: 'grid-p-06',
    code: 'GRID-P-06 (Pride Creek Basin)',
    bounds: { north: 38.48, south: 38.43, west: -87.30, east: -87.25 },
    center: { lat: 38.455, lng: -87.275 },
    status: 'scanned',
    anomaliesFoundCount: 2,
    lastScannedTime: '12 hours ago',
    scanProgressPercent: 100
  },
  {
    id: 'grid-p-07',
    code: 'GRID-P-07 (Patoka River Basin)',
    bounds: { north: 38.43, south: 38.38, west: -87.25, east: -87.20 },
    center: { lat: 38.405, lng: -87.225 },
    status: 'queued',
    anomaliesFoundCount: 0,
    nextScheduledScanTime: 'In 7 hours (Queued #2)',
    scanProgressPercent: 0
  },
  {
    id: 'grid-p-08',
    code: 'GRID-P-08 (Winslow Mill Reach)',
    bounds: { north: 38.43, south: 38.38, west: -87.20, east: -87.15 },
    center: { lat: 38.405, lng: -87.175 },
    status: 'scanned',
    anomaliesFoundCount: 1,
    lastScannedTime: '16 hours ago',
    scanProgressPercent: 100
  },
  {
    id: 'grid-p-09',
    code: 'GRID-P-09 (Snake Knob / Lockhart)',
    bounds: { north: 38.35, south: 38.30, west: -87.28, east: -87.20 },
    center: { lat: 38.325, lng: -87.240 },
    status: 'unscanned',
    anomaliesFoundCount: 0,
    scanProgressPercent: 0
  }
];

export const HISTORICAL_CHRONICLE_ACTS: HistoricalAct[] = [
  {
    actNumber: 'I',
    title: 'The Wilderness & The Old Trace',
    period: '1800 — 1811',
    theme: 'Frontier Solitude, Ancient Game Highways, and Woolsey Pride’s Hewed Logs',
    narrativeText: `Before surveyors carved Section 16 or drawn boundaries across southwestern Indiana, the land between the White River and the meandering Patoka was unbroken primeval forest. Ancient bison herds migrating between the salt licks of Kentucky and the Grand Prairie of Illinois had stamped a ten-foot sunken swale directly across the sandstone ridges—the legendary Buffalo Trace.

In 1800, Woolsey Pride halted his pack mules beside an icy, crystal-clear seep emerging from the base of a towering white oak grove: White Oak Springs. Within seven years, as the Shawnee prophet Tenskwatawa and his warrior brother Tecumseh gathered 1,000 braves along the upper Wabash, Pride notched massive oak timbers to erect a stout two-story defensive blockhouse. Families worked their corn patches with loaded flintlock rifles propped against stumps. Mail was carried on foot once a week by George Teverbaugh, who trod thirteen lonely miles of swamp and canebrake from Vincennes into the Pike interior.`,
    keyCitations: [
      'Goodspeed p. 251: "The first settlement made in the county was at White Oak Springs, in 1800, by Woolsey Pride. Here he built a block-house, about 1807."',
      'Goodspeed p. 255: "The road was there from time immemorial, leading from White River at Decker Ferry, White Oak Springs, Mud Holes, near Ireland... George Teverbaugh carried the mail over this route once a week on foot."'
    ]
  },
  {
    actNumber: 'II',
    title: 'The War & The Hewed-Log Founding',
    period: '1811 — 1826',
    theme: 'Tippecanoe Alarms, Peter Brenton’s Donation, and the Frontier Justice of 1817',
    narrativeText: `In the autumn of 1811, Governor William Henry Harrison led his army of regulars and hunting-shirt rangers past White Oak Springs on their fateful march to Tippecanoe. When the War of 1812 erupted across the frontier, settlers from miles around fled into Pride's blockhouse for weeks of anxious garrison watch.

Following statehood in 1816, the Indiana General Assembly created Pike County on December 21, 1816. The county commissioners met at Hosea Smith’s cabin on February 10, 1817. Peter Brenton, Henry Miley, and John Coonrod stepped forward to donate 112 acres of pristine ridge land for a seat of justice: named Petersburg in honor of Peter Brenton. 

By November 1817, Thomas C. Stewart raised the first two-story courthouse of hewed timbers for $599.75, alongside a fortified jail of double walls packed with upright logs and a public pillory. Court convened under Judge William Prince, where frontiersmen wrestled out boundary disputes, and John Youngman ran his copper still whose 1831 fire sent burning whiskey surging down town ditches to the awe of gathered squatters.`,
    keyCitations: [
      'Goodspeed p. 277: "The building was erected on Lot 107, on the east side of the public square. It was built of hewed logs, and was 32x24 feet, two stories high. The cost was $599.75."',
      'Goodspeed p. 336: "The commissioners have chosen and fixed the seat of justice on a donation of land made to the county by Peter Brenton, Henry Miley, Sr., Henry Miley, Jr., and John Coonrod... containing 112 acres."'
    ]
  },
  {
    actNumber: 'III',
    title: 'The Forest Reclaims & LiDAR Unveils',
    period: '1885 — Present',
    theme: 'Decaying Cabins, Overgrown Traces, and the Penetrating Laser Pulse',
    narrativeText: `By 1885, when the Goodspeed Brothers published their monumental history, the frontier had transformed into prosperous coal, timber, and agricultural communities. Yet as the 20th century progressed, remote 19th-century farmsteads were abandoned. Log walls rotted, stone chimneys tumbled inward, and the dense hardwood forest reclaimed old cornfields and pioneer homesteads.

For decades, the cellar holes, water wells, and sunken traces of Pike County lay hidden beneath an impenetrable wall of summer hickory, oak, and brambles—invisible to optical satellite cameras and aerial photography.

Now, airborne LiDAR (Light Detection and Ranging) strips away the deceit of modern leaf cover. Emitting millions of laser pulses per second, it filters out the tree tops and underbrush to record the micro-topography of the bare earth beneath. Instantly, the forgotten 1800s reappear: square four-foot cellar excavations, circular stone-lined well depressions, abandoned mill races along the Patoka, and the worn swales of the Governor’s Trace, preserving the footsteps of our pioneer forebears.`,
    keyCitations: [
      'Goodspeed p. 246: "The visible rocks of the county are massive conglomerates... and those of the coal measures... coal measures cover an area of 6,500 square miles."',
      'Goodspeed p. 276: "Siple’s mound lies about two miles west of Petersburg... having the mole extending back to a large spring... reached the depth of three feet upon the remains of three persons."'
    ]
  }
];
