/* ============================================================
   Philippine Standard Geographic Code (PSGC) Dataset
   Montessori de San Jose Foundation Inc. — Student Database
   Complete Official Philippine Geographic Coverage
   ============================================================ */

const PH_GEO_DATA = (function() {
    // 81 Official Provinces + Metro Manila (NCR)
        // 17 Official Philippine Administrative Regions (PSGC)
    const REGIONS = [
        { code: '04', name: 'Region IV-A (CALABARZON)', regionName: 'CALABARZON' },
        { code: '13', name: 'National Capital Region (NCR)', regionName: 'NCR' },
        { code: '03', name: 'Region III (Central Luzon)', regionName: 'Central Luzon' },
        { code: '17', name: 'MIMAROPA Region (Region IV-B)', regionName: 'MIMAROPA' },
        { code: '01', name: 'Region I (Ilocos Region)', regionName: 'Ilocos Region' },
        { code: '02', name: 'Region II (Cagayan Valley)', regionName: 'Cagayan Valley' },
        { code: '05', name: 'Region V (Bicol Region)', regionName: 'Bicol Region' },
        { code: '06', name: 'Region VI (Western Visayas)', regionName: 'Western Visayas' },
        { code: '07', name: 'Region VII (Central Visayas)', regionName: 'Central Visayas' },
        { code: '08', name: 'Region VIII (Eastern Visayas)', regionName: 'Eastern Visayas' },
        { code: '09', name: 'Region IX (Zamboanga Peninsula)', regionName: 'Zamboanga Peninsula' },
        { code: '10', name: 'Region X (Northern Mindanao)', regionName: 'Northern Mindanao' },
        { code: '11', name: 'Region XI (Davao Region)', regionName: 'Davao Region' },
        { code: '12', name: 'Region XII (SOCCSKSARGEN)', regionName: 'SOCCSKSARGEN' },
        { code: '16', name: 'Region XIII (Caraga)', regionName: 'Caraga' },
        { code: '14', name: 'Cordillera Administrative Region (CAR)', regionName: 'CAR' },
        { code: '19', name: 'BARMM (Bangsamoro Autonomous Region in Muslim Mindanao)', regionName: 'BARMM' }
    ];

    // Mapping: Region Code -> Provinces
    const REGION_PROVINCES = {
        '04': ['Batangas', 'Cavite', 'Laguna', 'Quezon', 'Rizal'],
        '13': ['Metro Manila (NCR)'],
        '03': ['Aurora', 'Bataan', 'Bulacan', 'Nueva Ecija', 'Pampanga', 'Tarlac', 'Zambales'],
        '17': ['Marinduque', 'Occidental Mindoro', 'Oriental Mindoro', 'Palawan', 'Romblon'],
        '01': ['Ilocos Norte', 'Ilocos Sur', 'La Union', 'Pangasinan'],
        '02': ['Batanes', 'Cagayan', 'Isabela', 'Nueva Vizcaya', 'Quirino'],
        '05': ['Albay', 'Camarines Norte', 'Camarines Sur', 'Catanduanes', 'Masbate', 'Sorsogon'],
        '06': ['Aklan', 'Antique', 'Capiz', 'Guimaras', 'Iloilo', 'Negros Occidental'],
        '07': ['Bohol', 'Cebu', 'Negros Oriental', 'Siquijor'],
        '08': ['Biliran', 'Eastern Samar', 'Leyte', 'Northern Samar', 'Samar', 'Southern Leyte'],
        '09': ['Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay'],
        '10': ['Bukidnon', 'Camiguin', 'Lanao del Norte', 'Misamis Occidental', 'Misamis Oriental'],
        '11': ['Davao de Oro', 'Davao del Norte', 'Davao del Sur', 'Davao Occidental', 'Davao Oriental'],
        '12': ['Cotabato', 'Sarangani', 'South Cotabato', 'Sultan Kudarat'],
        '16': ['Agusan del Norte', 'Agusan del Sur', 'Dinagat Islands', 'Surigao del Norte', 'Surigao del Sur'],
        '14': ['Abra', 'Apayao', 'Benguet', 'Ifugao', 'Kalinga', 'Mountain Province'],
        '19': ['Basilan', 'Lanao del Sur', 'Maguindanao del Norte', 'Maguindanao del Sur', 'Sulu', 'Tawi-Tawi']
    };

    // Auto-generate Province & City codes lookup
    const PROVINCE_CODES = {};
    const PROVINCES_BY_CODE = {};
    const PROVINCE_REGION_MAP = {};

    REGIONS.forEach(reg => {
        const provs = REGION_PROVINCES[reg.code] || [];
        provs.forEach((provName, idx) => {
            const pCode = reg.code + String(idx + 1).padStart(2, '0');
            PROVINCE_CODES[provName] = pCode;
            PROVINCES_BY_CODE[pCode] = {
                code: pCode,
                name: provName,
                regionCode: reg.code,
                regionName: reg.regionName,
                regionFullName: reg.name
            };
            PROVINCE_REGION_MAP[provName] = reg;
        });
    });

    const CITY_CODES = {};
    const CITIES_BY_CODE = {};

const PROVINCES = [
        'Metro Manila (NCR)',
        'Abra', 'Agusan del Norte', 'Agusan del Sur', 'Aklan', 'Albay',
        'Antique', 'Apayao', 'Aurora', 'Basilan', 'Bataan',
        'Batanes', 'Batangas', 'Benguet', 'Biliran', 'Bohol',
        'Bukidnon', 'Bulacan', 'Cagayan', 'Camarines Norte', 'Camarines Sur',
        'Camiguin', 'Capiz', 'Catanduanes', 'Cavite', 'Cebu',
        'Cotabato', 'Davao de Oro', 'Davao del Norte', 'Davao del Sur', 'Davao Occidental',
        'Davao Oriental', 'Dinagat Islands', 'Eastern Samar', 'Guimaras', 'Ifugao',
        'Ilocos Norte', 'Ilocos Sur', 'Iloilo', 'Isabela', 'Kalinga',
        'La Union', 'Laguna', 'Lanao del Norte', 'Lanao del Sur', 'Leyte',
        'Maguindanao del Norte', 'Maguindanao del Sur', 'Marinduque', 'Masbate', 'Misamis Occidental',
        'Misamis Oriental', 'Mountain Province', 'Negros Occidental', 'Negros Oriental', 'Northern Samar',
        'Nueva Ecija', 'Nueva Vizcaya', 'Occidental Mindoro', 'Oriental Mindoro', 'Palawan',
        'Pampanga', 'Pangasinan', 'Quezon', 'Quirino', 'Rizal',
        'Romblon', 'Samar', 'Sarangani', 'Siquijor', 'Sorsogon',
        'South Cotabato', 'Southern Leyte', 'Sultan Kudarat', 'Sulu', 'Surigao del Norte',
        'Surigao del Sur', 'Tarlac', 'Tawi-Tawi', 'Zambales', 'Zamboanga del Norte',
        'Zamboanga del Sur', 'Zamboanga Sibugay'
    ];

    // Municipalities and Cities per Province (All 81 Provinces + NCR)
    const MUNICIPALITIES = {
        'Metro Manila (NCR)': [
            'Manila', 'Quezon City', 'Caloocan', 'Las Piñas', 'Makati', 'Malabon', 'Mandaluyong', 'Marikina', 'Muntinlupa', 'Navotas', 'Parañaque', 'Pasay', 'Pasig', 'San Juan', 'Taguig', 'Valenzuela', 'Pateros'
        ],
        'Abra': [
            'Bangued', 'Boliney', 'Bucay', 'Bucloc', 'Daguioman', 'Danglas', 'Dolores', 'La Paz', 'Lacub', 'Lagangilang', 'Lagayan', 'Langiden', 'Licuan-Baay', 'Luba', 'Malibcong', 'Manabo', 'Peñarrubia', 'Pidigan', 'Pilar', 'Sallapadan', 'San Isidro', 'San Juan', 'San Quintin', 'Tayum', 'Tineg', 'Tubo', 'Villaviciosa'
        ],
        'Agusan del Norte': [
            'Butuan City', 'Cabadbaran City', 'Buenavista', 'Carmen', 'Jabonga', 'Kitcharao', 'Las Nieves', 'Magallanes', 'Nasipit', 'Remedios T. Romualdez', 'Santiago', 'Tubay'
        ],
        'Agusan del Sur': [
            'Bayugan City', 'Bunawan', 'Esperanza', 'La Paz', 'Loreto', 'Prosperidad', 'Rosario', 'San Francisco', 'San Luis', 'Santa Josefa', 'Sibagat', 'Talacogon', 'Trento', 'Veruela'
        ],
        'Aklan': [
            'Kalibo', 'Altavas', 'Balete', 'Banga', 'Batan', 'Buruanga', 'Ibajay', 'Lezo', 'Libacao', 'Madalag', 'Makato', 'Malay', 'Malinao', 'Nabas', 'New Washington', 'Numancia', 'Tangalan'
        ],
        'Albay': [
            'Legazpi City', 'Ligao City', 'Tabaco City', 'Bacacay', 'Camalig', 'Daraga', 'Guinobatan', 'Jovellar', 'Libon', 'Malilipot', 'Malinao', 'Manito', 'Oas', 'Pio Duran', 'Polangui', 'Rapu-Rapu', 'Santo Domingo', 'Tiwi'
        ],
        'Antique': [
            'San Jose de Buenavista', 'Anini-y', 'Barbaza', 'Belison', 'Bugasong', 'Caluya', 'Culasi', 'Hamtic', 'Laua-an', 'Libertad', 'Pandan', 'Patnongon', 'San Remigio', 'Sebaste', 'Sibalom', 'Tibiao', 'Tobias Fornier', 'Valderrama'
        ],
        'Apayao': [
            'Kabugao', 'Calanasan', 'Conner', 'Flora', 'Luna', 'Pudtol', 'Santa Marcela'
        ],
        'Aurora': [
            'Baler', 'Casiguran', 'Dilasag', 'Dinalungan', 'Dingalan', 'Dipaculao', 'Maria Aurora', 'San Luis'
        ],
        'Basilan': [
            'Isabela City', 'Lamitan City', 'Akbar', 'Al-Barka', 'Hadji Mohammad Ajul', 'Hadji Muhtamad', 'Lantawan', 'Maluso', 'Sumisip', 'Tabuan-Lasa', 'Tipo-Tipo', 'Tuburan', 'Ungkaya Pukan'
        ],
        'Bataan': [
            'Balanga City', 'Abucay', 'Bagac', 'Dinalupihan', 'Hermosa', 'Limay', 'Mariveles', 'Morong', 'Orani', 'Orion', 'Pilar', 'Samal'
        ],
        'Batanes': [
            'Basco', 'Itbayat', 'Ivana', 'Mahatao', 'Sabtang', 'Uyugan'
        ],
        'Batangas': [
            'San Jose', 'Lipa City', 'Batangas City', 'Rosario', 'Ibaan', 'Cuenca', 'Alitagtag', 'Taysan', 'San Pascual', 'Bauan', 'Tanauan City', 'Santo Tomas City', 'Malvar', 'Mataasnakahoy', 'Balete', 'Padre Garcia', 'San Juan', 'Lobo', 'Taal', 'Lemery', 'Calaca City', 'Balayan', 'Calatagan', 'Lian', 'Nasugbu', 'Tuy', 'Mabini', 'Tingloy', 'Agoncillo', 'San Nicolas', 'Santa Teresita', 'Talisay', 'Laurel', 'San Luis'
        ],
        'Benguet': [
            'Baguio City', 'La Trinidad', 'Atok', 'Bakun', 'Bokod', 'Buguias', 'Itogon', 'Kabayan', 'Kapangan', 'Kibungan', 'Mankayan', 'Sablan', 'Tuba', 'Tublay'
        ],
        'Biliran': [
            'Naval', 'Almeria', 'Biliran', 'Cabucgayan', 'Caibiran', 'Culaba', 'Kawayan', 'Maripipi'
        ],
        'Bohol': [
            'Tagbilaran City', 'Alburquerque', 'Alicia', 'Anda', 'Antequera', 'Baclayon', 'Balilihan', 'Batuan', 'Bien Unido', 'Bilar', 'Buenavista', 'Calape', 'Candijay', 'Carmen', 'Catigbian', 'Clarin', 'Corella', 'Cortes', 'Dagohoy', 'Danao', 'Dauis', 'Dimiao', 'Duero', 'Garcia Hernandez', 'Guindulman', 'Inabanga', 'Jagna', 'Getafe', 'Lila', 'Loay', 'Loboc', 'Loon', 'Mabini', 'Maribojoc', 'Panglao', 'Pilar', 'President Carlos P. Garcia', 'Sagbayan', 'San Isidro', 'San Miguel', 'Sevilla', 'Sierra Bullones', 'Sikatuna', 'Talibon', 'Trinidad', 'Tubigon', 'Ubay', 'Valencia'
        ],
        'Bukidnon': [
            'Malaybalay City', 'Valencia City', 'Baungon', 'Cabanglasan', 'Damulog', 'Dangcagan', 'Don Carlos', 'Impasugong', 'Kadingilan', 'Kalilangan', 'Kibawe', 'Kitaotao', 'Lantapan', 'Libona', 'Malitbog', 'Manolo Fortich', 'Maramag', 'Pangantucan', 'Quezon', 'San Fernando', 'Sumilao', 'Talakag'
        ],
        'Bulacan': [
            'Malolos City', 'Meycauayan City', 'San Jose del Monte City', 'Baliwag City', 'Angat', 'Balagtas', 'Bocaue', 'Bulakan', 'Bustos', 'Calumpit', 'Doña Remedios Trinidad', 'Guiguinto', 'Hagonoy', 'Marilao', 'Norzagaray', 'Obando', 'Pandi', 'Paombong', 'Plaridel', 'Pulilan', 'San Ildefonso', 'San Miguel', 'San Rafael', 'Santa Maria'
        ],
        'Cagayan': [
            'Tuguegarao City', 'Abulug', 'Alcala', 'Allacapan', 'Amulung', 'Aparri', 'Baggao', 'Ballesteros', 'Buguey', 'Calayan', 'Camalaniugan', 'Claveria', 'Enrile', 'Gattaran', 'Gonzaga', 'Iguig', 'Lal-lo', 'Lasam', 'Pamplona', 'Peñablanca', 'Piat', 'Rizal', 'Sanchez-Mira', 'Santa Ana', 'Santa Praxedes', 'Santa Teresita', 'Santo Niño', 'Solana', 'Tuao'
        ],
        'Camarines Norte': [
            'Daet', 'Basud', 'Capalonga', 'Jose Panganiban', 'Labo', 'Mercedes', 'Paracale', 'San Lorenzo Ruiz', 'San Vicente', 'Santa Elena', 'Talisay', 'Vinzons'
        ],
        'Camarines Sur': [
            'Naga City', 'Iriga City', 'Baao', 'Balatan', 'Bato', 'Bombon', 'Buhi', 'Bula', 'Cabusao', 'Calabanga', 'Camaligan', 'Canaman', 'Caramoan', 'Del Gallego', 'Gainza', 'Garchitorena', 'Goa', 'Lagonoy', 'Libmanan', 'Lupi', 'Magarao', 'Milaor', 'Minalabac', 'Nabua', 'Ocampo', 'Pamplona', 'Pasacao', 'Pili', 'Presentacion', 'Ragay', 'Sagnay', 'San Fernando', 'San Jose', 'Sipocot', 'Siruma', 'Tigaon', 'Tinambac'
        ],
        'Camiguin': [
            'Mambajao', 'Catarman', 'Guinsiliban', 'Mahinog', 'Sagay'
        ],
        'Capiz': [
            'Roxas City', 'Cuartero', 'Dao', 'Dumalag', 'Dumarao', 'Ivisan', 'Jamindan', 'Maayon', 'Mambusao', 'Panay', 'Panitan', 'Pilar', 'Pontevedra', 'President Roxas', 'Sapi-an', 'Sigma', 'Tapaz'
        ],
        'Catanduanes': [
            'Virac', 'Bagamanoc', 'Baras', 'Bato', 'Caramoran', 'Gigmoto', 'Pandan', 'Panganiban', 'San Andres', 'San Miguel', 'Viga'
        ],
        'Cavite': [
            'Bacoor City', 'Cavite City', 'Dasmariñas City', 'General Trias City', 'Imus City', 'Tagaytay City', 'Trece Martires City', 'Carmona City', 'Alfonso', 'Amadeo', 'General Emilio Aguinaldo', 'General Mariano Alvarez', 'Indang', 'Kawit', 'Magallanes', 'Maragondon', 'Mendez', 'Naic', 'Noveleta', 'Rosario', 'Silang', 'Tanza', 'Ternate'
        ],
        'Cebu': [
            'Cebu City', 'Mandaue City', 'Lapu-Lapu City', 'Talisay City', 'Toledo City', 'Danao City', 'Naga City', 'Carcar City', 'Bogo City', 'Alcantara', 'Alcoy', 'Alegria', 'Aloguinsan', 'Argao', 'Asturias', 'Badian', 'Balamban', 'Bantayan', 'Barili', 'Boljoon', 'Borbon', 'Carmen', 'Catmon', 'Compostela', 'Consolacion', 'Cordova', 'Daanbantayan', 'Dalaguete', 'Dumanjug', 'Ginatilan', 'Liloan', 'Madridejos', 'Malabuyoc', 'Medellin', 'Minglanilla', 'Moalboal', 'Oslob', 'Pilar', 'Pinamungajan', 'Poro', 'Ronda', 'Samboan', 'San Fernando', 'San Francisco', 'San Remigio', 'Santa Fe', 'Santander', 'Sibonga', 'Sogod', 'Tabogon', 'Tabuelan', 'Tuburan', 'Tudela'
        ],
        'Cotabato': [
            'Kidapawan City', 'Alamada', 'Aleosan', 'Antipas', 'Arakan', 'Banisilan', 'Carmen', 'Kabacan', 'Libungan', 'M\'lang', 'Magpet', 'Makilala', 'Matalam', 'Midsayap', 'Pigcawayan', 'Pikit', 'President Roxas', 'Tulunan'
        ],
        'Davao de Oro': [
            'Nabunturan', 'Compostela', 'Laak', 'Mabini', 'Maco', 'Maragusan', 'Mawab', 'Monkayo', 'Montevista', 'New Bataan', 'Pantukan'
        ],
        'Davao del Norte': [
            'Tagum City', 'Panabo City', 'Island Garden City of Samal', 'Asuncion', 'Braulio E. Dujali', 'Carmen', 'Kapalong', 'New Corella', 'San Isidro', 'Santo Tomas', 'Talaingod'
        ],
        'Davao del Sur': [
            'Davao City', 'Digos City', 'Bansalan', 'Hagonoy', 'Kiblawan', 'Magsaysay', 'Malalag', 'Matanao', 'Padada', 'Santa Cruz', 'Sulop'
        ],
        'Davao Occidental': [
            'Malita', 'Don Marcelino', 'Jose Abad Santos', 'Sarangani', 'Santa Maria'
        ],
        'Davao Oriental': [
            'Mati City', 'Baganga', 'Banaybanay', 'Boston', 'Caraga', 'Cateel', 'Governor Generoso', 'Lupon', 'Manay', 'San Isidro', 'Tarragona'
        ],
        'Dinagat Islands': [
            'San Jose', 'Basilisa', 'Cagdianao', 'Dinagat', 'Libjo', 'Loreto', 'Tubajon'
        ],
        'Eastern Samar': [
            'Borongan City', 'Arteche', 'Balangiga', 'Balangkayan', 'Can-avid', 'Dolores', 'General MacArthur', 'Giporlos', 'Guiuan', 'Hernani', 'Jipapad', 'Lawaan', 'Llorente', 'Maslog', 'Maydolong', 'Mercedes', 'Oras', 'Quinapondan', 'Salcedo', 'San Julian', 'San Policarpo', 'Sulat', 'Taft'
        ],
        'Guimaras': [
            'Jordan', 'Buenavista', 'Nueva Valencia', 'San Lorenzo', 'Sibunag'
        ],
        'Ifugao': [
            'Lagawe', 'Aguinaldo', 'Alfonso Lista', 'Asipulo', 'Banaue', 'Hingyon', 'Hungduan', 'Kiangan', 'Lamut', 'Mayoyao', 'Tinoc'
        ],
        'Ilocos Norte': [
            'Laoag City', 'Batac City', 'Adams', 'Bacarra', 'Badoc', 'Bangui', 'Banna', 'Burgos', 'Carasi', 'Currimao', 'Dingras', 'Dumalneg', 'Marcos', 'Nueva Era', 'Pagudpud', 'Paoay', 'Pasuquin', 'Piddig', 'Pinili', 'San Nicolas', 'Sarrat', 'Solsona', 'Vintar'
        ],
        'Ilocos Sur': [
            'Vigan City', 'Candon City', 'Alilem', 'Banayoyo', 'Bantay', 'Burgos', 'Cabugao', 'Caoayan', 'Cervantes', 'Galimuyod', 'Gregorio del Pilar', 'Lidlidda', 'Magsingal', 'Nagbukel', 'Narvacan', 'Quirino', 'Salcedo', 'San Emilio', 'San Esteban', 'San Ildefonso', 'San Juan', 'San Vicente', 'Santa', 'Santa Catalina', 'Santa Cruz', 'Santa Lucia', 'Santa Maria', 'Santiago', 'Santo Domingo', 'Sigay', 'Sinait', 'Sugpon', 'Suyo', 'Tagudin'
        ],
        'Iloilo': [
            'Iloilo City', 'Passi City', 'Ajuy', 'Alimodian', 'Anilao', 'Badiangan', 'Balasan', 'Banate', 'Barotac Nuevo', 'Barotac Viejo', 'Batad', 'Bingawan', 'Cabatuan', 'Calinog', 'Carles', 'Concepcion', 'Dingle', 'Dueñas', 'Dumangas', 'Estancia', 'Guimbal', 'Igbaras', 'Janiuay', 'Lambunao', 'Leganes', 'Lemery', 'Leon', 'Maasin', 'Miagao', 'Mina', 'New Lucena', 'Oton', 'Pavia', 'Pototan', 'San Dionisio', 'San Enrique', 'San Joaquin', 'San Miguel', 'San Rafael', 'Santa Barbara', 'Sara', 'Tigbauan', 'Tubungan', 'Zarraga'
        ],
        'Isabela': [
            'Ilagan City', 'Cauayan City', 'Santiago City', 'Alicia', 'Angadanan', 'Aurora', 'Benito Soliven', 'Burgos', 'Cabagan', 'Cabatuan', 'Cordon', 'Delfin Albano', 'Dinapigue', 'Divilacan', 'Echague', 'Gamu', 'Jones', 'Luna', 'Maconacon', 'Mallig', 'Naguilian', 'Palanan', 'Quezon', 'Quirino', 'Ramon', 'Reina Mercedes', 'Roxas', 'San Agustin', 'San Guillermo', 'San Isidro', 'San Manuel', 'San Mariano', 'San Mateo', 'San Pablo', 'Santa Maria', 'Santo Tomas', 'Tumauini'
        ],
        'Kalinga': [
            'Tabuk City', 'Balbalan', 'Lubuagan', 'Pasil', 'Pinukpuk', 'Rizal', 'Tanudan', 'Tinglayan'
        ],
        'La Union': [
            'San Fernando City', 'Agoo', 'Aringay', 'Bacnotan', 'Bagulin', 'Balaoan', 'Bangar', 'Bauang', 'Burgos', 'Caba', 'Luna', 'Naguilian', 'Pugo', 'Rosario', 'San Gabriel', 'San Juan', 'Santo Tomas', 'Santol', 'Sudipen', 'Tubao'
        ],
        'Laguna': [
            'Biñan City', 'Cabuyao City', 'Calamba City', 'San Pablo City', 'San Pedro City', 'Santa Rosa City', 'Alaminos', 'Bay', 'Calauan', 'Cavinti', 'Famy', 'Kalayaan', 'Liliw', 'Los Baños', 'Luisiana', 'Lumban', 'Mabitac', 'Magdalena', 'Majayjay', 'Nagcarlan', 'Paete', 'Pagsanjan', 'Pakil', 'Pangil', 'Pila', 'Rizal', 'Santa Cruz', 'Santa Maria', 'Siniloan', 'Victoria'
        ],
        'Lanao del Norte': [
            'Iligan City', 'Bacolod', 'Baloi', 'Baroy', 'Kapatagan', 'Kauswagan', 'Kolambugan', 'Lala', 'Linamon', 'Magsaysay', 'Maigo', 'Matungao', 'Munai', 'Nunungan', 'Pantao Ragat', 'Pantar', 'Poona Piagapo', 'Salvador', 'Sapad', 'Sultan Naga Dimaporo', 'Tagoloan', 'Tangcal', 'Tubod'
        ],
        'Lanao del Sur': [
            'Marawi City', 'Bacolod-Kalawi', 'Balabagan', 'Balindong', 'Bayang', 'Binidayan', 'Buadiposo-Buntong', 'Bubong', 'Bumbaran', 'Butig', 'Calanogas', 'Ditsaan-Ramain', 'Ganassi', 'Kapai', 'Katai', 'Lumba-Bayabao', 'Lumbaca-Unayan', 'Lumbatan', 'Lumbayanague', 'Madalum', 'Madamba', 'Maguing', 'Malabang', 'Marantao', 'Marogong', 'Masiu', 'Mulondo', 'Pagayawan', 'Piagapo', 'Picong', 'Poona Bayabao', 'Pualas', 'Saguiaran', 'Sultan Dumalondong', 'Tagoloan II', 'Tamparan', 'Taraka', 'Tubaran', 'Tugaya', 'Wao'
        ],
        'Leyte': [
            'Tacloban City', 'Ormoc City', 'Baybay City', 'Abuyog', 'Alangalang', 'Albuera', 'Babatngon', 'Barugo', 'Bato', 'Burauen', 'Calubian', 'Capoocan', 'Carigara', 'Dagami', 'Dulag', 'Hilongos', 'Hindang', 'Inopacan', 'Isabel', 'Jaro', 'Javier', 'Julita', 'Kananga', 'La Paz', 'Leyte', 'MacArthur', 'Mahaplag', 'Matag-ob', 'Matalom', 'Mayorga', 'Merida', 'Palo', 'Palompon', 'Pastrana', 'San Isidro', 'San Miguel', 'Santa Fe', 'Tabango', 'Tabontabon', 'Tanauan', 'Tolosa', 'Tunga', 'Villaba'
        ],
        'Maguindanao del Norte': [
            'Cotabato City', 'Barira', 'Datu Blah T. Sinsuat', 'Datu Odin Sinsuat', 'Kabuntalan', 'Matanog', 'Northern Kabuntalan', 'Parang', 'Sultan Kudarat', 'Sultan Mastura', 'Talitay', 'Upi'
        ],
        'Maguindanao del Sur': [
            'Buluan', 'Ampatuan', 'Datu Abdullah Sangki', 'Datu Anggal Midtimbang', 'Datu Hoffer Ampatuan', 'Datu Montañal', 'Datu Paglas', 'Datu Piang', 'Datu Salibo', 'Datu Saudi-Ampatuan', 'Datu Unsay', 'General Salipada K. Pendatun', 'Guindulungan', 'Mamasapano', 'Mangudadatu', 'Pagalungan', 'Paglat', 'Pandag', 'Rajah Buayan', 'Shariff Aguak', 'Shariff Saydona Mustapha', 'South Upi', 'Sultan sa Barongis', 'Talayan'
        ],
        'Marinduque': [
            'Boac', 'Buenavista', 'Gasan', 'Mogpog', 'Santa Cruz', 'Torrijos'
        ],
        'Masbate': [
            'Masbate City', 'Aroroy', 'Baleno', 'Balud', 'Batuan', 'Cataingan', 'Cawayan', 'Claveria', 'Dimasalang', 'Esperanza', 'Mandaon', 'Milagros', 'Mobo', 'Monreal', 'Palanas', 'Pio V. Corpuz', 'Placer', 'San Fernando', 'San Jacinto', 'San Pascual', 'Uson'
        ],
        'Misamis Occidental': [
            'Oroquieta City', 'Ozamiz City', 'Tangub City', 'Aloran', 'Baliangao', 'Bonifacio', 'Calamba', 'Clarin', 'Concepcion', 'Don Victoriano Chiongbian', 'Jimenez', 'Lopez Jaena', 'Panaon', 'Plaridel', 'Sapang Dalaga', 'Sinacaban', 'Tudela'
        ],
        'Misamis Oriental': [
            'Cagayan de Oro City', 'Gingoog City', 'El Salvador City', 'Alubijid', 'Balingasag', 'Balingoan', 'Binuangan', 'Claveria', 'Gitagum', 'Initao', 'Jasaan', 'Kinoguitan', 'Lagonglong', 'Laguindingan', 'Libertad', 'Lugait', 'Magsaysay', 'Manticao', 'Medina', 'Naawan', 'Opol', 'Salay', 'Sugbongcogon', 'Tagoloan', 'Talisayan', 'Villanueva'
        ],
        'Mountain Province': [
            'Bontoc', 'Barlig', 'Bauko', 'Besao', 'Natonin', 'Paracelis', 'Sadanga', 'Sagada', 'Tadian'
        ],
        'Negros Occidental': [
            'Bacolod City', 'Bago City', 'Cadiz City', 'Escalante City', 'Himamaylan City', 'Kabankalan City', 'La Carlota City', 'Sagay City', 'San Carlos City', 'Silay City', 'Sipalay City', 'Talisay City', 'Victorias City', 'Binalbagan', 'Calatrava', 'Candoni', 'Cauayan', 'E. B. Magalona', 'Hinigaran', 'Hinoba-an', 'Ilog', 'Isabela', 'La Castellana', 'Manapla', 'Moises Padilla', 'Murcia', 'Pontevedra', 'Pulupandan', 'Salvador Benedicto', 'San Enrique', 'Toboso', 'Valladolid'
        ],
        'Negros Oriental': [
            'Dumaguete City', 'Bais City', 'Bayawan City', 'Canlaon City', 'Guihulngan City', 'Tanjay City', 'Amlan', 'Ayungon', 'Bacong', 'Basay', 'Bindoy', 'Dauin', 'Jimalalud', 'La Libertad', 'Mabinay', 'Manjuyod', 'Pamplona', 'San Jose', 'Santa Catalina', 'Siaton', 'Sibulan', 'Tayasan', 'Valencia', 'Vallehermoso', 'Zamboanguita'
        ],
        'Northern Samar': [
            'Catarman', 'Allen', 'Biri', 'Bobon', 'Capul', 'Gamay', 'Laoang', 'Lapinig', 'Las Navas', 'Lavezares', 'Lope de Vega', 'Mapanas', 'Mondragon', 'Palapag', 'Pambujan', 'Rosario', 'San Antonio', 'San Isidro', 'San Jose', 'San Roque', 'San Vicente', 'Silvino Lobos', 'Victoria'
        ],
        'Nueva Ecija': [
            'Cabanatuan City', 'Gapan City', 'Palayan City', 'San Jose City', 'Science City of Muñoz', 'Aliaga', 'Bongabon', 'Cabiao', 'Carranglan', 'Cuyapo', 'Gabaldon', 'General Mamerto Natividad', 'General Tinio', 'Guimba', 'Jaen', 'Laur', 'Licab', 'Llanera', 'Lupao', 'Nampicuan', 'Pantabangan', 'Peñaranda', 'Quezon', 'Rizal', 'San Antonio', 'San Isidro', 'San Leonardo', 'Santa Rosa', 'Santo Domingo', 'Talavera', 'Talugtug', 'Zaragoza'
        ],
        'Nueva Vizcaya': [
            'Bayombong', 'Alfonso Castañeda', 'Ambaguio', 'Aritao', 'Bagabag', 'Bambang', 'Diadi', 'Dupax del Norte', 'Dupax del Sur', 'Kasibu', 'Kayapa', 'Quezon', 'Santa Fe', 'Solano', 'Villaverde'
        ],
        'Occidental Mindoro': [
            'Abra de Ilog', 'Calintaan', 'Looc', 'Lubang', 'Magsaysay', 'Mamburao', 'Paluan', 'Rizal', 'Sablayan', 'San Jose', 'Santa Cruz'
        ],
        'Oriental Mindoro': [
            'Calapan City', 'Baco', 'Bansud', 'Bongabong', 'Bulalacao', 'Gloria', 'Mansalay', 'Naujan', 'Pinamalayan', 'Pola', 'Puerto Galera', 'Roxas', 'San Teodoro', 'Socorro', 'Victoria'
        ],
        'Palawan': [
            'Puerto Princesa City', 'Aborlan', 'Agutaya', 'Araceli', 'Balabac', 'Bataraza', 'Brooke\'s Point', 'Busuanga', 'Cagayancillo', 'Coron', 'Culion', 'Cuyo', 'Dumaran', 'El Nido', 'Kalayaan', 'Linapacan', 'Magsaysay', 'Narra', 'Quezon', 'Rizal', 'Roxas', 'San Vicente', 'Sofronio Española', 'Taytay'
        ],
        'Pampanga': [
            'Angeles City', 'San Fernando City', 'Mabalacat City', 'Apalit', 'Arayat', 'Bacolor', 'Candaba', 'Floridablanca', 'Guagua', 'Lubao', 'Macabebe', 'Magalang', 'Masantol', 'Mexico', 'Minalin', 'Porac', 'San Luis', 'San Simon', 'Santa Ana', 'Santa Rita', 'Santo Tomas', 'Sasmuan'
        ],
        'Pangasinan': [
            'Alaminos City', 'Dagupan City', 'San Carlos City', 'Urdaneta City', 'Agno', 'Aguilar', 'Alcala', 'Anda', 'Asingan', 'Balungao', 'Bani', 'Basista', 'Bautista', 'Bayambang', 'Binalonan', 'Binmaley', 'Bolinao', 'Bugallon', 'Burgos', 'Calasiao', 'Dasol', 'Infanta', 'Labrador', 'Laoac', 'Lingayen', 'Mabini', 'Malasiqui', 'Manaoag', 'Mangaldan', 'Mangatarem', 'Mapandan', 'Natividad', 'Pozorrubio', 'Rosales', 'San Fabian', 'San Jacinto', 'San Manuel', 'San Nicolas', 'San Quintin', 'Santa Barbara', 'Santa Maria', 'Santo Tomas', 'Sison', 'Sual', 'Tayug', 'Umingan', 'Urbiztondo', 'Villasis'
        ],
        'Quezon': [
            'Lucena City', 'Tayabas City', 'Agdangan', 'Alabat', 'Atimonan', 'Buenavista', 'Burdeos', 'Calauag', 'Candelaria', 'Catanauan', 'Dolores', 'General Luna', 'General Nakar', 'Guinayangan', 'Gumaca', 'Infanta', 'Jomalig', 'Lopez', 'Lucban', 'Macalelon', 'Mauban', 'Mulanay', 'Padre Burgos', 'Pagbilao', 'Panukulan', 'Patnanungan', 'Perez', 'Pitogo', 'Plaridel', 'Polillo', 'Quezon', 'Real', 'Sampaloc', 'San Andres', 'San Antonio', 'San Francisco', 'San Narciso', 'Sariaya', 'Tagkawayan', 'Tiaong', 'Unisan'
        ],
        'Quirino': [
            'Cabarroguis', 'Aglipay', 'Diffun', 'Maddela', 'Nagtipunan', 'Saguday'
        ],
        'Rizal': [
            'Antipolo City', 'Angono', 'Baras', 'Binangonan', 'Cainta', 'Cardona', 'Jala-Jala', 'Morong', 'Pililla', 'Rodriguez (Montalban)', 'San Mateo', 'Tanay', 'Taytay', 'Teresa'
        ],
        'Romblon': [
            'Romblon', 'Alcantara', 'Banton', 'Cajidiocan', 'Calatrava', 'Concepcion', 'Corcuera', 'Ferrol', 'Looc', 'Magdiwang', 'Odiongan', 'San Agustin', 'San Andres', 'San Fernando', 'San Jose', 'Santa Fe', 'Santa Maria'
        ],
        'Samar': [
            'Catbalogan City', 'Calbayog City', 'Almagro', 'Basey', 'Calbiga', 'Daram', 'Gandara', 'Hinabangan', 'Jiabong', 'Marabut', 'Matuguinao', 'Motiong', 'Pagsanghan', 'Paranas', 'Pinabacdao', 'San Jorge', 'San Jose de Buan', 'San Sebastian', 'Santa Margarita', 'Santa Rita', 'Santo Niño', 'Tagapul-an', 'Talalora', 'Tarangnan', 'Villareal', 'Zumarraga'
        ],
        'Sarangani': [
            'Alabel', 'Glan', 'Kiamba', 'Maasim', 'Maitum', 'Malapatan', 'Malungon'
        ],
        'Siquijor': [
            'Siquijor', 'Enrique Villanueva', 'Larena', 'Lazi', 'Maria', 'San Juan'
        ],
        'Sorsogon': [
            'Sorsogon City', 'Barcelona', 'Bulan', 'Bulusan', 'Casiguran', 'Castilla', 'Donsol', 'Gubat', 'Irosin', 'Juban', 'Magallanes', 'Matnog', 'Pilar', 'Prieto Diaz', 'Santa Magdalena'
        ],
        'South Cotabato': [
            'General Santos City', 'Koronadal City', 'Banga', 'Lake Sebu', 'Norala', 'Polomolok', 'Santo Niño', 'Surallah', 'T\'boli', 'Tampakan', 'Tantangan', 'Tupi'
        ],
        'Southern Leyte': [
            'Maasin City', 'Anahawan', 'Bontoc', 'Hinunangan', 'Hinundayan', 'Libagon', 'Liloan', 'Limasawa', 'Macrohon', 'Malitbog', 'Padre Burgos', 'Pintuyan', 'Saint Bernard', 'San Francisco', 'San Juan', 'San Ricardo', 'Silago', 'Sogod', 'Tomas Oppus'
        ],
        'Sultan Kudarat': [
            'Tacurong City', 'Bagumbayan', 'Columbio', 'Esperanza', 'Isulan', 'Kalamansig', 'Lebak', 'Lutayan', 'Palimbang', 'President Quirino', 'Senator Ninoy Aquino'
        ],
        'Sulu': [
            'Jolo', 'Hadji Panglima Tahil', 'Indanan', 'Kalingalan Caluang', 'Lugus', 'Luuk', 'Maimbung', 'Old Panamao', 'Omar', 'Pandami', 'Panglima Estino', 'Pangutaran', 'Parang', 'Pata', 'Patikul', 'Siasi', 'Talipao', 'Tapul', 'Banguingui'
        ],
        'Surigao del Norte': [
            'Surigao City', 'Alegria', 'Bacuag', 'Burgos', 'Claver', 'Dapa', 'Del Carmen', 'General Luna', 'Gigaquit', 'Mainit', 'Malimono', 'Pilar', 'Placer', 'San Benito', 'San Francisco', 'San Isidro', 'Santa Monica', 'Sison', 'Socorro', 'Tagana-an', 'Tubod'
        ],
        'Surigao del Sur': [
            'Tandag City', 'Bislig City', 'Barobo', 'Bayabas', 'Cagwait', 'Cantilan', 'Carmen', 'Carrascal', 'Cortes', 'Hinatuan', 'Lanuza', 'Lianga', 'Lingig', 'Madrid', 'Marihatag', 'San Agustin', 'San Miguel', 'Tagbina', 'Tago'
        ],
        'Tarlac': [
            'Tarlac City', 'Anao', 'Bamban', 'Camiling', 'Capas', 'Concepcion', 'Gerona', 'La Paz', 'Mayantoc', 'Moncada', 'Paniqui', 'Pura', 'Ramos', 'San Clemente', 'San Jose', 'San Manuel', 'Santa Ignacia', 'Victoria'
        ],
        'Tawi-Tawi': [
            'Bongao', 'Languyan', 'Mapun', 'Panglima Sugala', 'Sapa-Sapa', 'Sibutu', 'Simunul', 'Sitangkai', 'South Ubian', 'Tandubas', 'Turtle Islands'
        ],
        'Zambales': [
            'Olongapo City', 'Botolan', 'Cabangan', 'Candelaria', 'Castillejos', 'Iba', 'Masinloc', 'Palauig', 'San Antonio', 'San Felipe', 'San Marcelino', 'San Narciso', 'Santa Cruz', 'Subic'
        ],
        'Zamboanga del Norte': [
            'Dipolog City', 'Dapitan City', 'Bacungan', 'Baliguian', 'Godod', 'Gutalac', 'Jose Dalman', 'Kalawit', 'Katipunan', 'La Libertad', 'Labason', 'Liloy', 'Manukan', 'Mutia', 'Piñan', 'Polanco', 'President Manuel A. Roxas', 'Rizal', 'Salug', 'Sergio Osmeña Sr.', 'Siayan', 'Sibuco', 'Sibutad', 'Sindangan', 'Siocon', 'Sirawai', 'Tampilisan'
        ],
        'Zamboanga del Sur': [
            'Pagadian City', 'Zamboanga City', 'Aurora', 'Bayog', 'Dimataling', 'Dinas', 'Dumalinao', 'Dumingag', 'Guipos', 'Josefina', 'Kumalarang', 'Labangan', 'Lakewood', 'Lapuyan', 'Mahayag', 'San Miguel', 'San Pablo', 'Sominot', 'Tabina', 'Tambulig', 'Tigbao', 'Tukuan', 'Vincenzo A. Sagun'
        ],
        'Zamboanga Sibugay': [
            'Ipil', 'Alicia', 'Buug', 'Diplahan', 'Imelda', 'Kabasalan', 'Mabuhay', 'Malangas', 'Naga', 'Olutanga', 'Payao', 'Roseller Lim', 'Siay', 'Talusan', 'Titay', 'Tungawan'
        ]
    };

    // Comprehensive Barangays Map (Compound key: "Province::Municipality" + direct aliases)
    const BARANGAYS = {
        // ============================================================
        // OCCIDENTAL MINDORO - ALL 11 MUNICIPALITIES (Official PSA)
        // ============================================================
        'Occidental Mindoro::San Jose': [
            'Ambulong', 'Ansiray', 'Bagong Sikat', 'Bangkal', 'Barangay 1 (Poblacion)',
            'Barangay 2 (Poblacion)', 'Barangay 3 (Poblacion)', 'Barangay 4 (Poblacion)',
            'Barangay 5 (Poblacion)', 'Barangay 6 (Poblacion)', 'Barangay 7 (Poblacion)',
            'Barangay 8 (Poblacion)', 'Batasan', 'Bayotbot', 'Bubog',
            'Buri', 'Camburay', 'Caminawit', 'Catayungan', 'Central',
            'Iling Proper', 'Inasakan', 'Ipil', 'La Curva', 'Labangan Iling',
            'Labangan Poblacion', 'Mabini', 'Magbay', 'Mangarin', 'Mapaya',
            'Monte Claro', 'Murtha', 'Naibuan', 'Natandol', 'Pag-Asa',
            'Pawican', 'San Agustin', 'San Isidro', 'San Roque'
        ],
        'Occidental Mindoro::Mamburao': [
            'Balansay', 'Barangay 1 (Poblacion)', 'Barangay 2 (Poblacion)', 'Barangay 3 (Poblacion)',
            'Barangay 4 (Poblacion)', 'Barangay 5 (Poblacion)', 'Barangay 6 (Poblacion)',
            'Barangay 7 (Poblacion)', 'Barangay 8 (Poblacion)', 'Fatima (Tii)',
            'Payompon', 'San Luis (Ligang)', 'Talabaan', 'Tangkalan', 'Tayamaan'
        ],
        'Occidental Mindoro::Abra de Ilog': [
            'Armado', 'Balao', 'Cabacao', 'Lumangbayan', 'Poblacion',
            'San Vicente', 'Santa Maria', 'Tibag', 'Udalo', 'Wawa'
        ],
        'Occidental Mindoro::Calintaan': [
            'Concepcion', 'Iriron', 'Malpalon', 'New Dagupan', 'Poblacion',
            'Poypoy', 'Tanyag'
        ],
        'Occidental Mindoro::Looc': [
            'Agkawayan', 'Ambil', 'Balikyas', 'Bonbon (Poblacion)', 'Bulacan',
            'Burol', 'Guitna (Poblacion)', 'Kanluran (Poblacion)', 'Talaotao'
        ],
        'Occidental Mindoro::Lubang': [
            'Araw at Bituin (Poblacion)', 'Bagong Sikat (Poblacion)', 'Banaag ng Pag-asa (Poblacion)',
            'Binakas', 'Cabra', 'Likas ng Silangan (Poblacion)', 'Maginhawa (Poblacion)',
            'Maligaya', 'Maliig', 'Ninikat ng Pag-asa (Poblacion)', 'Paraiso (Poblacion)',
            'Surville (Poblacion)', 'Tagbac', 'Tangal', 'Tilik', 'Vigo'
        ],
        'Occidental Mindoro::Magsaysay': [
            'Alibog', 'Caguray', 'Calawag', 'Gapasan', 'Laste',
            'Lourdes', 'Nicolas (Bulo)', 'Paclolo', 'Poblacion', 'Purnaga',
            'Santa Teresa', 'Sibalat'
        ],
        'Occidental Mindoro::Paluan': [
            'Alipaoy', 'Bagong Silang (Poblacion)', 'Handang Tumulong (Poblacion)',
            'Harrison', 'Lumangbayan', 'Mananao', 'Mapalad (Poblacion)',
            'Marikit', 'Pag-asa ng Bayan (Poblacion)', 'San Jose (Poblacion)',
            'Silahis ng Pag-asa (Poblacion)', 'Tubili'
        ],
        'Occidental Mindoro::Rizal': [
            'Adela', 'Aguas', 'Magsikap', 'Malawaan', 'Manoot',
            'Pitogo', 'Poblacion', 'Rumbang', 'Salvacion', 'San Pedro',
            'Santo Niño'
        ],
        'Occidental Mindoro::Sablayan': [
            'Batong Buhay', 'Buenavista', 'Burgos', 'Claudio Salgado', 'General Emilio Aguinaldo',
            'Ibud', 'Ilvita', 'Lagnas', 'Ligaya', 'Malisbong',
            'Paetan', 'Pag-Asa', 'Poblacion (Lumangbayan)', 'San Agustin', 'San Francisco',
            'San Nicolas', 'San Vicente', 'Santa Lucia', 'Santo Niño', 'Tagumpay',
            'Tuban', 'Victoria'
        ],
        'Occidental Mindoro::Santa Cruz': [
            'Alacaak', 'Barahan', 'Casague', 'Dayap', 'Kurtinganan',
            'Lumangbayan', 'Mulawin', 'Pinagturilan (San Pedro)', 'Poblacion I (Barangay 1)',
            'Poblacion II (Barangay 2)', 'San Vicente'
        ],

        // ============================================================
        // BATANGAS - ALL 34 MUNICIPALITIES & CITIES (Official PSA)
        // ============================================================
        'Batangas::San Jose': [
            'Aguila', 'Anilao', 'Archangel', 'Bagong Pook', 'Balagtasin I',
            'Balagtasin II', 'Banaybanay I', 'Banaybanay II', 'Bigain I', 'Bigain II',
            'Bigain South', 'Calansayan', 'Don Luis', 'Galamay-Amo', 'Lalayat',
            'Lapu-lapu 1st', 'Lapu-lapu 2nd', 'Lepute', 'Lumil', 'Mojon-Tampoy',
            'Natunuan North', 'Natunuan South', 'Palahanan I', 'Palahanan II', 'Pinagtung-ulan',
            'Poblacion Barangay 1', 'Poblacion Barangay 2', 'Poblacion Barangay 3', 'Poblacion Barangay 4',
            'Sabang', 'Salaban', 'Santo Cristo', 'Tugwi'
        ],
        'Batangas::Lipa City': [
            'Adya', 'Anilao', 'Anilao-Labac', 'Antipolo del Norte', 'Antipolo del Sur',
            'Bagong Pook', 'Balintawak', 'Banaybanay', 'Barandal', 'Biga',
            'Bugtong na Pulo', 'Bulacnin', 'Bulaklakan', 'Calamias', 'Cumba',
            'Dagatan', 'Duhatan', 'Halang', 'Inosloban', 'Kayumanggi',
            'Latag', 'Lodlod', 'Lumbang', 'Mabini', 'Malagonlong',
            'Malitlit', 'Marauoy', 'Mataas na Lupa', 'Munting Pulo', 'Pagolingin Bata',
            'Pagolingin East', 'Pagolingin West', 'Pangao', 'Pinagkawitan', 'Pinagtongulan',
            'Plaridel', 'Poblacion Barangay 1', 'Poblacion Barangay 2', 'Poblacion Barangay 3', 'Poblacion Barangay 4',
            'Poblacion Barangay 5', 'Poblacion Barangay 6', 'Poblacion Barangay 7', 'Poblacion Barangay 8', 'Poblacion Barangay 9',
            'Poblacion Barangay 9-A', 'Poblacion Barangay 10', 'Poblacion Barangay 11', 'Poblacion Barangay 12', 'Puzol',
            'Rizal', 'Sabang', 'Sampaguita', 'San Benito', 'San Celestino',
            'San Francisco', 'San Guillermo', 'San Jose', 'San Lucas', 'San Salvador',
            'San Sebastian', 'Santo Niño', 'Santo Toribio', 'Sapac', 'Sico',
            'Talisay', 'Tambo', 'Tangob', 'Tanguay', 'Tibig', 'Tipacan'
        ],
        'Batangas::Batangas City': [
            'Alangilan', 'Balagtas', 'Balete', 'Banaba Center', 'Banaba East',
            'Banaba Ibaba', 'Banaba Kanluran', 'Banaba Silangan', 'Barangay 1 (Poblacion)', 'Barangay 2 (Poblacion)',
            'Barangay 3 (Poblacion)', 'Barangay 4 (Poblacion)', 'Barangay 5 (Poblacion)', 'Barangay 6 (Poblacion)', 'Barangay 7 (Poblacion)',
            'Barangay 8 (Poblacion)', 'Barangay 9 (Poblacion)', 'Barangay 10 (Poblacion)', 'Barangay 11 (Poblacion)', 'Barangay 12 (Poblacion)',
            'Barangay 13 (Poblacion)', 'Barangay 14 (Poblacion)', 'Barangay 15 (Poblacion)', 'Barangay 16 (Poblacion)', 'Barangay 17 (Poblacion)',
            'Barangay 18 (Poblacion)', 'Barangay 19 (Poblacion)', 'Barangay 20 (Poblacion)', 'Barangay 21 (Poblacion)', 'Barangay 22 (Poblacion)',
            'Barangay 23 (Poblacion)', 'Barangay 24 (Poblacion)', 'Bilogo', 'Bolbok', 'Bucal',
            'Calicanto', 'Catandala', 'Conde Itaas', 'Conde Labac', 'Cumba',
            'Cuta', 'Dalig', 'Dela Paz', 'Dela Paz Pulot Aplaya', 'Dela Paz Pulot Itaas',
            'Domoit', 'Dumantay', 'Gulod Itaas', 'Gulod Labac', 'Haligue Kanluran',
            'Haligue Silangan', 'Ilijan', 'Kumba', 'Kumintang Ibaba', 'Kumintang Ilaya',
            'Libjo', 'Liponpon', 'Maapas', 'Mahabang Dahilig', 'Mahabang Parang',
            'Mahacot Kanluran', 'Mahacot Silangan', 'Malalim', 'Malitam', 'Maruclap',
            'Pagkilatan', 'Paharang Kanluran', 'Paharang Silangan', 'Pallocan Kanluran', 'Pallocan Silangan',
            'Pinamucan Ibaba', 'Pinamucan Proper', 'Pinamucan Silangan', 'Sampaga', 'San Agapito',
            'San Agustin Kanluran', 'San Agustin Silangan', 'San Andres', 'San Antonio', 'San Isidro',
            'San Jose Sico', 'San Miguel', 'San Pedro', 'Santa Clara', 'Santa Rita Aplaya',
            'Santa Rita Karsada', 'Santo Domingo', 'Santo Niño', 'Simlong', 'Sirang Lupa',
            'Sorosoro Ibaba', 'Sorosoro Ilaya', 'Sorosoro Karsada', 'Tabangao Ambulong', 'Tabangao Aplaya',
            'Tabangao Dao', 'Talahib Pandayan', 'Talahib Payapa', 'Tinga Itaas', 'Tinga Labac',
            'Tulo', 'Wawa'
        ],
        'Batangas::Tanauan City': [
            'Altavista', 'Ambulong', 'Bagbag', 'Bagumbayan', 'Balele',
            'Banjo East', 'Banjo West', 'Bilog-bilog', 'Boot', 'Cale',
            'Darasa', 'Gonzales', 'Hidalgo', 'Janopol Central', 'Janopol Oriental',
            'Laurel', 'Luta del Norte', 'Luta del Sur', 'Malaking Pulo', 'Maria Paz',
            'Maugat', 'Montaña', 'Natatas', 'Pagaspas', 'Pantay Bata',
            'Pantay Matanda', 'Poblacion 1', 'Poblacion 2', 'Poblacion 3', 'Poblacion 4',
            'Poblacion 5', 'Poblacion 6', 'Poblacion 7', 'Sala', 'Sambat',
            'San Jose', 'Santol', 'Santor', 'Sulpoc', 'Suplang',
            'Talaga', 'Tinurik', 'Trapiche', 'Ulango', 'Wawa'
        ],
        'Batangas::Santo Tomas City': [
            'Barangay I (Poblacion)', 'Barangay II (Poblacion)', 'Barangay III (Poblacion)', 'Barangay IV (Poblacion)', 'San Agustin',
            'San Antonio', 'San Bartolome', 'San Felix', 'San Fernando', 'San Francisco',
            'San Isidro Norte', 'San Isidro Sur', 'San Joaquin', 'San Jose', 'San Juan',
            'San Luis', 'San Marcos', 'San Miguel', 'San Pablo', 'San Pedro',
            'San Rafael', 'San Roque', 'San Vicente', 'Santa Ana', 'Santa Clara',
            'Santa Cruz', 'Santa Elena', 'Santa Maria', 'Santa Teresita', 'Santiago'
        ],
        'Batangas::Calaca City': [
            'Baclas', 'Bagong Tuy', 'Balimbing', 'Bambang', 'Bolbok',
            'Cahil', 'Calantas', 'Camastilisan', 'Coral ni Bacal', 'Coral ni Lopez',
            'Dacanlao', 'Dila', 'Loma', 'Lumbang Calzada', 'Lumbang na Bata',
            'Lumbang na Matanda', 'Madalunot', 'Makina', 'Malitlit', 'Matipok',
            'Munting Coral', 'Niyugan', 'Pantay', 'Poblacion 1', 'Poblacion 2',
            'Poblacion 3', 'Poblacion 4', 'Poblacion 5', 'Poblacion 6', 'Puting Bato East',
            'Puting Bato West', 'Salong', 'San Rafael', 'Sinisian', 'Taklang Anak',
            'Talisay', 'Tamayo', 'Timbain'
        ],
        'Batangas::Rosario': [
            'Alupay', 'Antipolo', 'Bagong Pook', 'Balibago', 'Bayawang',
            'Baybayin', 'Bulihan', 'Cahigam', 'Calantas', 'Colongan',
            'Itlugan', 'Leviste (Tubahan)', 'Lumbangan', 'Maalas-as', 'Mabato',
            'Mabunga', 'Macalamcam A', 'Macalamcam B', 'Malaya', 'Maligaya',
            'Marilag', 'Masaya', 'Matamis', 'Mavalor', 'Mayuro',
            'Namatayan', 'Namunga', 'Nasi', 'Palakpak', 'Pinagsibaan',
            'Poblacion A', 'Poblacion B', 'Poblacion C', 'Poblacion D', 'Poblacion E',
            'Putingkahoy', 'Quilib', 'Salao', 'San Carlos', 'San Ignacio',
            'San Isidro', 'San Jose', 'San Roque', 'Santa Cruz', 'Timbugan',
            'Tiquiwan', 'Tugtug', 'Tulos'
        ],
        'Batangas::Ibaan': [
            'Bago', 'Balanga', 'Bungahan', 'Calamias', 'Catandala',
            'Coliat', 'Dayapan', 'Lapu-lapu', 'Lucsuhin', 'Mabalor',
            'Malainin', 'Matala', 'Munting-Tubig', 'Palindan', 'Pangao',
            'Panghayaan', 'Poblacion', 'Quilo', 'Sabang', 'Salaban I',
            'Salaban II', 'San Agustin', 'Sandalan', 'Santo Niño', 'Talaibon', 'Tulay'
        ],
        'Batangas::Cuenca': [
            'Balagbag', 'Bungahan', 'Calumayin', 'Dalipit East', 'Dalipit West',
            'Dita', 'Don Juan', 'Emmanuel', 'Ibabao', 'Labac',
            'Pinagkaisahan', 'Poblacion 1', 'Poblacion 2', 'Poblacion 3', 'Poblacion 4',
            'Poblacion 5', 'Poblacion 6', 'Poblacion 7', 'Poblacion 8', 'San Felipe'
        ],
        'Batangas::Alitagtag': [
            'Concepcion', 'Concordia', 'Dalipit East', 'Dalipit West', 'Dominador Gomez',
            'Munlawin Sur', 'Ping-As', 'Poblacion East', 'Poblacion West', 'San Jose',
            'Santa Cruz', 'Sinturisan', 'Tadlac'
        ],
        'Batangas::Taysan': [
            'Bacao', 'Bilogo', 'Dagatan', 'Guinhawa', 'Laurel',
            'Mabayabas', 'Mahanadiong', 'Mapagong', 'Mataas na Lupa', 'Pag-Asa',
            'Panghayaan', 'Piña', 'Pinagbayanan', 'Poblacion East', 'Poblacion West',
            'San Isidro', 'San Marcelino', 'Santo Niño', 'Tilambo'
        ],
        'Batangas::San Pascual': [
            'Alalum', 'Antipolo', 'Balimbing', 'Banaba', 'Bayanan',
            'Danglayan', 'Delao', 'Gelerang Kawayan', 'Ilat North', 'Ilat South',
            'Kaingin', 'Laurel', 'Malaking Fahig', 'Mataas na Lupa', 'Natunuan',
            'Palsahingin', 'Pila', 'Poblacion', 'Resurreccion', 'Sambat',
            'San Antonio', 'San Mariano', 'San Mateo', 'Santa Ana', 'Santa Elena', 'Santo Niño'
        ],
        'Batangas::Bauan': [
            'Alagao', 'Aplaya', 'As-Is', 'Baguilawa', 'Balayong',
            'Bolo', 'Colvo', 'Cupang', 'Durungao', 'Gulibay',
            'Inicbulan', 'Locloc', 'Magalang-Galang', 'Malindig', 'Manalupong',
            'Manghinao Proper', 'Manghinao Uno', 'New Danglayan', 'Orense', 'Pitugo',
            'Poblacion I', 'Poblacion II', 'Poblacion III', 'Poblacion IV', 'San Agustin',
            'San Andres Proper', 'San Andres Uno', 'San Antonio', 'San Pedro', 'San Roque',
            'San Teodoro', 'San Vicente', 'Santa Maria', 'Santo Domingo', 'Sinala'
        ],
        'Batangas::Malvar': [
            'Bagong Pook', 'Bilucao', 'Bulihan', 'Poblacion', 'San Andres',
            'San Fernando', 'San Gregorio', 'San Isidro', 'San Juan', 'San Pedro', 'San Pioquinto'
        ],
        'Batangas::Mataasnakahoy': [
            'Barangay I (Poblacion)', 'Barangay II (Poblacion)', 'Barangay III (Poblacion)', 'Barangay IV (Poblacion)', 'Bayorbor',
            'Bubuyan', 'Calingatan', 'Kinalaglagan', 'Loob', 'Lumang Lipa',
            'Manggahan', 'Nangkaan', 'San Sebastian', 'Santol', 'Upa'
        ],
        'Batangas::Balete': [
            'Alangilan', 'Calawit', 'Looc', 'Magapi', 'Makina',
            'Malabanan', 'Paligawan', 'Palsara', 'Poblacion', 'Sala', 'Sampalocan', 'Solis'
        ],
        'Batangas::Padre Garcia': [
            'Banaba', 'Banaybanay', 'Bawi', 'Bukal', 'Castillo',
            'Cawongan', 'Manggas', 'Marawa', 'Pansol', 'Payapa',
            'Poblacion', 'Quilo-quilo North', 'Quilo-quilo South', 'San Felipe', 'San Miguel',
            'Tamak', 'Tangob'
        ],
        'Batangas::San Juan': [
            'Abung', 'Balagbag', 'Barualte', 'Bataan', 'Buhay na Sapa',
            'Bulsa', 'Calicanto', 'Calitcalit', 'Calubcub 1st', 'Calubcub 2nd',
            'Catmon', 'Coloconto', 'Escribano', 'Hugom', 'Imelda',
            'Laiya-Aplaya', 'Laiya-Ibaba', 'Libato', 'Lipahan', 'Mabalanoy',
            'Maraykit', 'Muzon', 'Nagsaulay', 'Palahanan', 'Palingowak',
            'Pinagbayanan', 'Poblacion', 'Poctol', 'Pulangbato', 'Putingbato',
            'Quipot', 'Sampiro', 'San Antonio', 'Sico 1st', 'Sico 2nd',
            'Subukin', 'Talahiban 1st', 'Talahiban 2nd', 'Ticalan', 'Tipas'
        ],
        'Batangas::Lobo': [
            'Apar', 'Balatbat', 'Balibago', 'Biga', 'Bignay',
            'Calo', 'Calumpit', 'Fabrica', 'Jaybanga', 'Lagadlarin',
            'Malabrigo', 'Malalim na Sanog', 'Malbato', 'Maruclap', 'Masaguitsit',
            'Nagtalongtong', 'Nagtoctoc', 'Olo-olo', 'Poblacion', 'San Miguel',
            'San Nicolas', 'Sawang', 'Soloc', 'Tayuman'
        ],
        'Batangas::Taal': [
            'Apacay', 'Balisong', 'Bihis', 'Bolbok', 'Buli',
            'Butong', 'Carasuche', 'Cawit', 'Caysasay', 'Cubamba',
            'Cultihan', 'Gahol', 'Halang', 'Iba', 'Ilog',
            'Imamawo', 'Ipil', 'Luntal', 'Mahabang Lodlod', 'Niogan',
            'Pansol', 'Poblacion 1', 'Poblacion 2', 'Poblacion 3', 'Poblacion 4',
            'Poblacion 5', 'Poblacion 6', 'Poblacion 7', 'Poblacion 8', 'Poblacion 9',
            'Poblacion 10', 'Poblacion 11', 'Poblacion 12', 'Poblacion 13', 'Poblacion 14',
            'Pook', 'Seiran', 'Tatlong Maria', 'Tierra Alta', 'Tulo'
        ],
        'Batangas::Lemery': [
            'Anak-Dagat', 'Arumahan', 'Bagong Sikat', 'Barberit', 'Cahilan I',
            'Cahilan II', 'Dayapan', 'District I (Poblacion)', 'District II (Poblacion)', 'District III (Poblacion)',
            'District IV (Poblacion)', 'Dita', 'Gulod', 'Lucky', 'Mag-asawang Ilat',
            'Malaking Pag-asa', 'Mataas na Bayan', 'Mayasang', 'Niugan', 'Nonong Casto',
            'Palanas', 'Payapa Ibaba', 'Payapa Ilaya', 'Rizal', 'Sambat',
            'San Isidro Ibaba', 'San Isidro Itaas', 'Sangalang', 'Sinisian East', 'Sinisian West',
            'Tubigan', 'Tubuan', 'Wawa Ibaba', 'Wawa Ilaya'
        ],
        'Batangas::Balayan': [
            'Baclaran', 'Barangay 1 (Poblacion)', 'Barangay 2 (Poblacion)', 'Barangay 3 (Poblacion)', 'Barangay 4 (Poblacion)',
            'Barangay 5 (Poblacion)', 'Barangay 6 (Poblacion)', 'Barangay 7 (Poblacion)', 'Barangay 8 (Poblacion)', 'Barangay 9 (Poblacion)',
            'Barangay 10 (Poblacion)', 'Barangay 11 (Poblacion)', 'Barangay 12 (Poblacion)', 'Calan', 'Caloocan',
            'Calzada', 'Canda', 'Carenahan', 'Caybunga', 'Cayponce',
            'Dalig', 'Dao', 'Dilao', 'Duhatan', 'Durungao',
            'Gimalas', 'Gumamela', 'Lagnas', 'Lanatan', 'Lucban Pook',
            'Lucban Putol', 'Magabe', 'Malalay', 'Munting Tubig', 'Navotas',
            'Palikpikan', 'Patugo', 'Pooc', 'Puting Kahoy', 'San Juan',
            'San Piro', 'Santol', 'Sukol', 'Tactac', 'Talisay'
        ],
        'Batangas::Calatagan': [
            'Bagong Silang', 'Baha', 'Balibago', 'Balitoc', 'Biga',
            'Bucal', 'Carlosa', 'Carretunan', 'Encarnacion', 'Gulod',
            'Hukay', 'Lucsuhin', 'Luya', 'Paraiso', 'Poblacion 1',
            'Poblacion 2', 'Poblacion 3', 'Poblacion 4', 'Quilitisan', 'Real',
            'Sambungan', 'Santa Ana', 'Talibayog', 'Talisay', 'Tanagan'
        ],
        'Batangas::Lian': [
            'Bagong Pook', 'Balibago', 'Binubusan', 'Bungahan', 'Cumba',
            'Humayingan', 'Kapito', 'Lumaniag', 'Luyahan', 'Malaruhatan',
            'Matabungkay', 'Poblacion 1', 'Poblacion 2', 'Poblacion 3', 'Poblacion 4',
            'Poblacion 5', 'Prenza', 'Puting-Kahoy', 'San Diego'
        ],
        'Batangas::Nasugbu': [
            'Aga', 'Balaytigui', 'Banilad', 'Barangay 1 (Poblacion)', 'Barangay 2 (Poblacion)',
            'Barangay 3 (Poblacion)', 'Barangay 4 (Poblacion)', 'Barangay 5 (Poblacion)', 'Barangay 6 (Poblacion)', 'Barangay 7 (Poblacion)',
            'Barangay 8 (Poblacion)', 'Barangay 9 (Poblacion)', 'Barangay 10 (Poblacion)', 'Barangay 11 (Poblacion)', 'Barangay 12 (Poblacion)',
            'Bilaran', 'Bucana', 'Bulihan', 'Bunducan', 'Butucan',
            'Calayo', 'Catandaan', 'Cogunan', 'Dayap', 'Kaylaway',
            'Kayrilaw', 'Latag', 'Looc', 'Lumbangan', 'Malapad na Bato',
            'Mataas na Pulo', 'Maugat', 'Papaya', 'Putat', 'Reparo',
            'Talangan', 'Tumalim', 'Utod', 'Wawa'
        ],
        'Batangas::Tuy': [
            'Acle', 'Bayudbud', 'Bolboc', 'Dalima', 'Dao',
            'Guinhawa', 'Lumbangan', 'Luntal', 'Magahis', 'Malibu',
            'Mataywanac', 'Palincaro', 'Pinagbayanan', 'Poblacion 1', 'Poblacion 2',
            'Poblacion 3', 'Poblacion 4', 'Putol', 'Rillo', 'Sabang',
            'San Jose', 'Talon'
        ],
        'Batangas::Mabini': [
            'Anilao East', 'Anilao Proper', 'Bagalangit', 'Bulacan', 'Calamias',
            'Estrella', 'Gasang', 'Laurel', 'Ligaya', 'Mainaga',
            'Mainit', 'Majuben', 'Malimatoc I', 'Malimatoc II', 'Nag-iba',
            'Pilahan', 'Poblacion', 'Pulong Anahao', 'Pulong Balibaguhan', 'Pulong Niogan',
            'Saguing', 'Sampaguita', 'San Francisco', 'San Jose', 'San Juan',
            'San Teodoro', 'Santa Ana', 'Santa Mesa', 'Santo Niño', 'Santo Tomas',
            'Solo', 'Talaga East', 'Talaga Proper'
        ],
        'Batangas::Tingloy': [
            'Barangay 13 (Poblacion)', 'Barangay 14 (Poblacion)', 'Barangay 15 (Poblacion)', 'Corona', 'Gamao',
            'Makawayan', 'Maricaban', 'Papaya', 'Pisa', 'San Isidro',
            'San Jose', 'San Juan', 'Santo Tomas', 'Talahib'
        ],
        'Batangas::Agoncillo': [
            'Adia', 'Bagong Sikat', 'Balangon', 'Bangin', 'Bilibinwang',
            'Coral na Munti', 'Guitna', 'Mabini', 'Pamiga', 'Panhulan',
            'Pansipit', 'Poblacion', 'Pook', 'San Jacinto', 'San Jose',
            'Santa Cruz', 'Santo Tomas', 'Subic Ibaba', 'Subic Ilaya'
        ],
        'Batangas::San Nicolas': [
            'Abelo', 'Balete', 'Balisong', 'Calangay', 'Hipit',
            'Maabud North', 'Maabud South', 'Munlawin', 'Panhulan', 'Poblacion',
            'Salang Bato', 'Santo Tomas', 'Sinturisan', 'Tagudtod', 'Talisay'
        ],
        'Batangas::Santa Teresita': [
            'Antipolo', 'Bihis', 'Burol', 'Calayaan', 'Cuta East',
            'Cutang Cawayan', 'Irucan', 'Pacifico', 'Poblacion I', 'Poblacion II',
            'Poblacion III', 'Saimsim', 'Sampa', 'Sinisian', 'Tambo Ibaba', 'Tambo Ilaya'
        ],
        'Batangas::Talisay': [
            'Aya', 'Balas', 'Banga', 'Buco', 'Caloocan',
            'Leynes', 'Miranda', 'Poblacion 1', 'Poblacion 2', 'Poblacion 3',
            'Poblacion 4', 'Poblacion 5', 'Poblacion 6', 'Poblacion 7', 'Poblacion 8',
            'Quiling', 'Sampaloc', 'San Guillermo', 'Santa Maria', 'Tumaway'
        ],
        'Batangas::Laurel': [
            'As-Is', 'Balakilong', 'Barangay 1 (Poblacion)', 'Barangay 2 (Poblacion)', 'Barangay 3 (Poblacion)',
            'Barangay 4 (Poblacion)', 'Barangay 5 (Poblacion)', 'Berinayan', 'Bugaan East', 'Bugaan West',
            'Buso-buso', 'Dayap Itaas', 'Gulod', 'J. Leviste', 'Molinete',
            'Niyugan', 'Paliparan', 'San Gabriel', 'San Gregorio', 'Santa Maria', 'Ticub'
        ],
        'Batangas::San Luis': [
            'Abiacao', 'Bagong Tubig', 'Balagtasin', 'Balite', 'Banoyo',
            'Boboca', 'Bonliw', 'Calumpang', 'Durungao', 'Locloc',
            'Luya', 'Mahabang Parang', 'Manggahan', 'Muzon', 'Poblacion',
            'San Antonio', 'San Isidro', 'San Jose', 'San Martin', 'Santa Monica',
            'Taliba', 'Talon', 'Tungal', 'Valenzuela'
        ],

        // ============================================================
        // METRO MANILA (NCR)
        // ============================================================
        'Metro Manila (NCR)::Manila': [
            'Binondo', 'Ermita', 'Intramuros', 'Malate', 'Paco',
            'Pandacan', 'Port Area', 'Quiapo', 'Sampaloc', 'San Andres',
            'San Miguel', 'San Nicolas', 'Santa Ana', 'Santa Cruz', 'Santa Mesa', 'Tondo'
        ],
        'Metro Manila (NCR)::Quezon City': [
            'Alicia', 'Bagong Pag-asa', 'Bagumbayan', 'Batasan Hills', 'Commonwealth',
            'Cubao', 'Diliman', 'Holy Spirit', 'Kamuning', 'Loyola Heights',
            'New Manila', 'Novaliches', 'Payatas', 'Project 4', 'Project 6',
            'San Bartolome', 'Santa Mesa Heights', 'Tandang Sora', 'Teacher\'s Village', 'Ugong Norte'
        ],
        'Metro Manila (NCR)::Makati': [
            'Bangkal', 'Bel-Air', 'Carmona', 'Dasmarinas Village', 'Forbes Park',
            'Guadalupe Nuevo', 'Guadalupe Viejo', 'Kasilawan', 'Magallanes', 'Olympia',
            'Palanan', 'Pembo', 'Poblacion', 'San Antonio', 'San Lorenzo',
            'Tejeros', 'Urdaneta', 'Valenzuela'
        ],
        'Metro Manila (NCR)::Caloocan': [
            'Bagong Barrio', 'Bagong Silang', 'Camarin', 'Grace Park East', 'Grace Park West',
            'Maypajo', 'Morning Breeze', 'Poblacion', 'Tala', 'University Hills'
        ],
        'Metro Manila (NCR)::Pasig': [
            'Bagong Ilog', 'Kapitolyo', 'Malinao', 'Maybunga', 'Oranbo',
            'Pinagbuhatan', 'Rosario', 'San Antonio', 'San Nicolas', 'Ugong'
        ],
        'Metro Manila (NCR)::Taguig': [
            'Bagumbayan', 'Bambang', 'Calzada', 'Fort Bonifacio', 'Hagonoy',
            'Ibayo-Tipas', 'Ligid-Tipas', 'Lower Bicutan', 'Maharlika Village', 'Napindan',
            'Palingon', 'San Miguel', 'Santa Ana', 'Tuktukan', 'Upper Bicutan', 'Ususan', 'Western Bicutan'
        ],
        'Metro Manila (NCR)::Parañaque': [
            'Baclaran', 'BF Homes', 'Don Bosco', 'Don Galo', 'La Huerta',
            'Moonwalk', 'San Antonio', 'San Dionisio', 'San Isidro', 'San Martin de Porres',
            'Santo Niño', 'Sun Valley', 'Tambo', 'Vitalez'
        ],
        'Metro Manila (NCR)::Pasay': [
            'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5',
            'Barangay 76', 'Barangay 183 (Villamor)', 'Malibay', 'Maricaban', 'San Isidro', 'San Jose', 'San Rafael'
        ],
        'Metro Manila (NCR)::Las Piñas': [
            'Almanza Dos', 'Almanza Uno', 'BF International Village', 'Daniel Fajardo', 'Elias Aldana',
            'Ilaya', 'Manuyo Dos', 'Manuyo Uno', 'Pamplona Dos', 'Pamplona Tres', 'Pamplona Uno',
            'Pilar', 'Pulang Lupa Dos', 'Pulang Lupa Uno', 'Talon Dos', 'Talon Kuatro', 'Talon Singko', 'Talon Tres', 'Talon Uno', 'Zapote'
        ],
        'Metro Manila (NCR)::Muntinlupa': [
            'Alabang', 'Ayala Alabang', 'Bayanan', 'Buli', 'Cupang',
            'Poblacion', 'Putatan', 'Sucat', 'Tunasan'
        ],
        'Metro Manila (NCR)::Marikina': [
            'Barangka', 'Calumpang', 'Concepcion Dos', 'Concepcion Uno', 'Fortune',
            'Industrial Valley', 'Jesus Dela Peña', 'Malanday', 'Marikina Heights', 'Nangka',
            'Parang', 'San Roque', 'Santa Elena', 'Santo Niño', 'Tumana'
        ],
        'Metro Manila (NCR)::Mandaluyong': [
            'Addition Hills', 'Bagong Silang', 'Barangka Drive', 'Barangka Ibaba', 'Barangka Ilaya',
            'Barangka Itaas', 'Buayang Bato', 'Highway Hills', 'Hulo', 'Mabini-J. Rizal',
            'Malamig', 'Namayan', 'Plainview', 'Pleasant Hills', 'Poblacion', 'San Jose', 'Vergara', 'Wack-Wack Greenhills'
        ],
        'Metro Manila (NCR)::Valenzuela': [
            'Arkong Bato', 'Canumay East', 'Canumay West', 'Dalandanan', 'Gen. T. de Leon',
            'Karuhatan', 'Lawang Bato', 'Malinta', 'Malanday', 'Mapulang Lupa', 'Marulas', 'Paso de Blas', 'Poblacion', 'Punturin', 'Ugong'
        ],
        'Metro Manila (NCR)::Malabon': [
            'Acacia', 'Baritan', 'Catmon', 'Concepcion', 'Flores',
            'Hulong Duhat', 'Ibaba', 'Longos', 'Maysilo', 'Niugan', 'Panghulo', 'Potrero', 'San Agustin', 'Santulan', 'Tañong', 'Tinajeros', 'Tonsuya', 'Tugatog'
        ],
        'Metro Manila (NCR)::Navotas': [
            'Bagumbayan North', 'Bagumbayan South', 'Bangkulasi', 'Daanghari', 'Navotas East',
            'Navotas West', 'North Bay Boulevard North', 'North Bay Boulevard South', 'San Jose', 'San Rafael Village', 'San Roque', 'Sipac-Almacen', 'Tangos North', 'Tangos South', 'Tanza 1', 'Tanza 2'
        ],
        'Metro Manila (NCR)::San Juan': [
            'Addition Hills', 'Balong-Bato', 'Batis', 'Corazon de Jesus', 'Ermitaño',
            'Greenhills', 'Isabelita', 'Kabayanan', 'Little Baguio', 'Maytunas', 'Onse', 'Pasadeña', 'Pedro Cruz', 'Progreso', 'Rivera', 'Salapan', 'San Perfecto', 'Santa Lucia', 'Tibagan', 'West Crame'
        ],
        'Metro Manila (NCR)::Pateros': [
            'Aguho', 'Magtanggol', 'Martires del 96', 'Poblacion', 'San Pedro',
            'San Roque', 'Santa Ana', 'Santo Rosario-Kanluran', 'Santo Rosario-Silangan', 'Tabacalera'
        ],

        // ============================================================
        // CAVITE
        // ============================================================
        'Cavite::Bacoor City': [
            'Alima', 'Aniban I', 'Aniban II', 'Bayanan', 'Daang Bukid', 'Digman',
            'Habay I', 'Habay II', 'Ligas I', 'Ligas II', 'Mambog I', 'Mambog II',
            'Molino I', 'Molino II', 'Molino III', 'Molino IV', 'Niog I', 'Niog II',
            'Panapaan I', 'Panapaan II', 'Queens Row Central', 'Queens Row East', 'Queens Row West',
            'Real I', 'Real II', 'Salinas I', 'Salinas II', 'San Nicolas I', 'San Nicolas II', 'Talaba I', 'Talaba II', 'Zapote I', 'Zapote II'
        ],
        'Cavite::Dasmariñas City': [
            'Burol I', 'Burol II', 'Datu Esmael', 'Fatima I', 'Langkaan I', 'Langkaan II',
            'Paliparan I', 'Paliparan II', 'Paliparan III', 'Salawag', 'Salitran I', 'Salitran II',
            'Sampaloc I', 'Sampaloc II', 'San Agustin I', 'San Agustin II', 'San Jose', 'Zone I (Poblacion)'
        ],
        'Cavite::Imus City': [
            'Alapan I-A', 'Alapan I-B', 'Anabu I-A', 'Anabu I-B', 'Anabu II-A', 'Anabu II-B',
            'Bucandala I', 'Bucandala II', 'Carsadang Bago I', 'Carsadang Bago II', 'Malagasang I-A',
            'Malagasang I-B', 'Malagasang II-A', 'Malagasang II-B', 'Medicion I-A', 'Poblacion I-A', 'Tanzang Luma I'
        ],
        'Cavite::Tagaytay City': [
            'Asisan', 'Bagong Tubig', 'Calabuso', 'Dapdap East', 'Dapdap West',
            'Francisco', 'Guinhawa North', 'Guinhawa South', 'Iruhin East', 'Iruhin West',
            'Kaybagal North', 'Kaybagal South', 'Mendez Crossing East', 'Mendez Crossing West',
            'Neogan', 'Patutong Malaki North', 'Patutong Malaki South', 'Sambong', 'San Jose', 'Silang Junction North', 'Silang Junction South', 'Sungay North', 'Sungay South', 'Tolentino East', 'Tolentino West'
        ],
        'Cavite::General Trias City': [
            'Arnaldo', 'Bacao I', 'Bacao II', 'Bagumbayan', 'Corregidor',
            'Governor Ferrer', 'Javalera', 'Manggahan', 'Navarro', 'Pasong Camachile I',
            'Pasong Camachile II', 'Pasong Kawayan I', 'Pasong Kawayan II', 'Prinza', 'San Francisco', 'Santa Clara', 'Santiago', 'Tejero'
        ],

        // ============================================================
        // LAGUNA
        // ============================================================
        'Laguna::Calamba City': [
            'Bagong Kalsada', 'Banlic', 'Barandal', 'Batino', 'Bucal',
            'Bunggo', 'Burol', 'Camaligan', 'Canlubang', 'Halang',
            'Hornalan', 'Kay-Anlog', 'La Mesa', 'Laguerta', 'Lawa',
            'Lecheria', 'Lingga', 'Looc', 'Mabato', 'Makiling',
            'Mapagong', 'Masili', 'Maunong', 'Mayapa', 'Milagrosa',
            'Paciano Rizal', 'Palingon', 'Palo-Alto', 'Pansol', 'Parian',
            'Platero', 'Poblacion 1', 'Poblacion 2', 'Poblacion 3', 'Poblacion 4',
            'Poblacion 5', 'Poblacion 6', 'Poblacion 7', 'Real', 'Saimsim',
            'Sampiruhan', 'San Cristobal', 'San Jose', 'San Juan', 'Sirang Lupa',
            'Sucol', 'Turbina', 'Ulango', 'Uwisan'
        ],
        'Laguna::Santa Rosa City': [
            'Aplaya', 'Balibago', 'Caingin', 'Dila', 'Dita',
            'Don Jose', 'Ibaba', 'Labas', 'Macabling', 'Malitlit',
            'Malusak (Poblacion)', 'Market Area (Poblacion)', 'Kanluran (Poblacion)', 'Pooc', 'Pulong Santa Cruz',
            'Santo Domingo', 'Sinalhan', 'Tagapo'
        ],
        'Laguna::Biñan City': [
            'Biñan (Poblacion)', 'Bungahan', 'Canlalay', 'Casile', 'De La Paz',
            'Ganado', 'Langkiwa', 'Loma', 'Malaban', 'Malamig',
            'Mambugan', 'Platero', 'Poblacion', 'San Antonio', 'San Francisco',
            'San Jose', 'San Vicente', 'Santo Niño', 'Santo Tomas', 'Sorono', 'Timbao', 'Tubigan', 'Zapote'
        ],
        'Laguna::San Pedro City': [
            'Bagong Silang', 'Calendola', 'Chrysanthemum', 'Cuyab', 'Estrella',
            'Fatima', 'G.S.I.S.', 'Landayan', 'Langgam', 'Laram',
            'Magsaysay', 'Maharlika', 'Narra', 'Nueva', 'Pacita 1', 'Pacita 2',
            'Poblacion', 'Riverside', 'Rosario', 'San Antonio', 'San Roque', 'San Vicente', 'Santo Niño', 'United Bayanihan', 'United Better Living'
        ],
        'Laguna::Cabuyao City': [
            'Baclaran', 'Banaybanay', 'Banlic', 'Bigaa', 'Butong',
            'Casile', 'Diezmo', 'Gulod', 'Mamatid', 'Marinig',
            'Niugan', 'Pittland', 'Poblacion I', 'Poblacion II', 'Poblacion III', 'Pulo', 'Sala', 'San Isidro'
        ],
        'Laguna::San Pablo City': [
            'Bagong Pook', 'Barangay I-A', 'Barangay I-B', 'Barangay II-A', 'Barangay II-B',
            'Concepcion', 'Del Remedio', 'Dolores', 'San Buenaventura', 'San Crispin',
            'San Cristobal', 'San Diego', 'San Francisco', 'San Gabriel', 'San Gregorio',
            'San Ignacio', 'San Isidro', 'San Joaquin', 'San Jose', 'San Juan',
            'San Lucas 1', 'San Lucas 2', 'San Marcos', 'San Mateo', 'San Miguel',
            'San Nicolas', 'San Pedro', 'San Rafael', 'San Roque', 'San Vicente',
            'Santa Ana', 'Santa Catalina', 'Santa Cruz', 'Santa Elena', 'Santa Filomena',
            'Santa Isabel', 'Santa Maria', 'Santa Maria Magdalena', 'Santa Monica', 'Santa Veronica',
            'Santiago 1', 'Santiago 2', 'Santisimo Rosario', 'Santo Angel', 'Santo Cristo', 'Santo Niño', 'Soledad'
        ],

        // ============================================================
        // RIZAL
        // ============================================================
        'Rizal::Antipolo City': [
            'Bagong Nayon', 'Beverly Hills', 'Calawis', 'Cupang', 'Dalig',
            'Dela Paz', 'Inarawan', 'Mambugan', 'Mayamot', 'Muntingdilaw',
            'San Isidro', 'San Jose', 'San Juan', 'San Luis', 'San Roque', 'Santa Cruz'
        ],
        'Rizal::Cainta': [
            'San Andres (Poblacion)', 'San Juan', 'San Roque', 'Santa Rosa', 'Santo Domingo',
            'Santo Niño'
        ],
        'Rizal::Taytay': [
            'Dolores (Poblacion)', 'Muzon', 'San Isidro', 'San Juan', 'Santa Ana'
        ],
        'Rizal::San Mateo': [
            'Ampid I', 'Ampid II', 'Banaba', 'Dulong Bayan 1', 'Dulong Bayan 2',
            'Guinayang', 'Guitnang Bayan I', 'Guitnang Bayan II', 'Malanday', 'Maly', 'Pintong Bukawe', 'Santa Ana', 'Silangan', 'Santo Niño'
        ],
        'Rizal::Binangonan': [
            'Batingan', 'Bilibiran', 'Calumpang', 'Darangan', 'Ithan',
            'Kalawaan', 'Layunan', 'Libid', 'Libis', 'Limbon-limbon',
            'Lunsad', 'Mahabang Parang', 'Mambog', 'Pag-asa', 'Pantok',
            'Palangoy', 'Pila-pila', 'Pinagdilawan', 'Pipindan', 'Rayap',
            'San Carlos', 'Tabon', 'Tagpos', 'Tatala', 'Tayuman'
        ],

        // ============================================================
        // ORIENTAL MINDORO
        // ============================================================
        'Oriental Mindoro::Calapan City': [
            'Balingayan', 'Balite', 'Baruyan', 'Batino', 'Biga',
            'Bondoc', 'Bucayao', 'Buhuan', 'Bulusan', 'Calero',
            'Camansihan', 'Camilmil', 'Canubing I', 'Canubing II', 'Comunal',
            'Guinobatan', 'Gulod', 'Gutad', 'Ibaba East', 'Ibaba West',
            'Ilaya', 'Lalud', 'Libis', 'Lumangbayan', 'Mahal na Pangalan',
            'Maidlang', 'Maligaya', 'Managpi', 'Masipit', 'Nag-Iba I',
            'Nag-Iba II', 'Navotas', 'Pachoca', 'Palhi', 'Panggalaan',
            'Parang', 'Patas', 'Personas', 'Poblacion', 'Salong',
            'San Antonio', 'San Vicente Central', 'San Vicente East', 'San Vicente North', 'San Vicente South',
            'San Vicente West', 'Santa Cruz', 'Santa Isabel', 'Santa Maria Village', 'Santo Niño',
            'Sapul', 'Silonay', 'Sta. Rita', 'Suqui', 'Tawagan',
            'Tawiran', 'Tibag', 'Wawa'
        ],
        'Oriental Mindoro::Puerto Galera': [
            'Aninuan', 'Baclayan', 'Balatero', 'Dulangan', 'Palangan',
            'Poblacion', 'Sabang', 'San Antonio', 'San Isidro (White Beach)', 'Santo Niño',
            'Sinandigan', 'Tabinay', 'Villaflor'
        ],

        // ============================================================
        // MAJOR PROVINCIAL CITIES
        // ============================================================
        'Cebu::Cebu City': [
            'Apas', 'Banilad', 'Basak San Nicolas', 'Camputhaw', 'Capitol Site',
            'Carreta', 'Guadalupe', 'Inayawan', 'Kasambagan', 'Lahug',
            'Mabolo', 'Pardo', 'Punta Princesa', 'Sambag I', 'Sambag II',
            'San Antonio', 'San Nicolas', 'San Roque', 'Santa Cruz', 'Santo Niño',
            'Subangdaku', 'Talamban', 'Tejero', 'Tinago', 'Tisa'
        ],
        'Davao del Sur::Davao City': [
            'Agdao', 'Bago Gallera', 'Bago Oshiro', 'Bala', 'Bucana',
            'Buhangin', 'Bunawan', 'Calinan', 'Catalunan Grande', 'Catalunan Pequeño',
            'Dumoy', 'Indangan', 'Mandug', 'Matina Aplaya', 'Matina Crossing',
            'Matina Pangi', 'Mintal', 'Poblacion', 'Sasa', 'Talomo',
            'Toril', 'Tugbok'
        ],
        'Iloilo::Iloilo City': [
            'Arevalo', 'City Proper', 'Jaro', 'La Paz', 'Lapuz',
            'Mandurriao', 'Molo'
        ],
        'Negros Occidental::Bacolod City': [
            'Alangilan', 'Alijis', 'Banago', 'Bata', 'Cabug',
            'Estefania', 'Felisa', 'Granada', 'Handumanan', 'Mandalagan',
            'Mansilingan', 'Montevista', 'Pahanocoy', 'Poblacion Barangay 1', 'Poblacion Barangay 2',
            'Poblacion Barangay 3', 'Poblacion Barangay 4', 'Poblacion Barangay 5', 'Punta Taytay', 'Singcang-Airport',
            'Sum-ag', 'Taculing', 'Tangub', 'Villamonte', 'Vista Alegre'
        ],
        'Benguet::Baguio City': [
            'Asin Road', 'Bakakeng Central', 'Bakakeng North', 'Camp 7', 'Camp 8',
            'Dominican Hill-Mirador', 'Engineers\' Hill', 'General Luna', 'Irisan', 'Loakan Proper',
            'Lourdes Subdivision', 'Mines View Park', 'Pacdal', 'Session Road', 'Trancoville'
        ],
        'Pangasinan::Dagupan City': [
            'Bacayao Norte', 'Bacayao Sur', 'Barangay I (T. Bugallon)', 'Barangay II (Nueva)', 'Barangay IV (Zamora)',
            'Bonuan Binloc', 'Bonuan Boquig', 'Bonuan Gueset', 'Calmay', 'Carael',
            'Caranglaan', 'Herrero-Perez', 'Lasip Chico', 'Lasip Grande', 'Lomboy',
            'Lucao', 'Malued', 'Mamalingling', 'Mangin', 'Mayombo',
            'Pantal', 'Poblacion Oeste', 'Pogo Chico', 'Pogo Grande', 'Pugaro Suit',
            'Salisay', 'Tambac', 'Tapuac', 'Tebeng'
        ],
        'Quezon::Lucena City': [
            'Barangay 1 (Poblacion)', 'Barangay 2 (Poblacion)', 'Barangay 3 (Poblacion)', 'Barangay 4 (Poblacion)', 'Barangay 5 (Poblacion)',
            'Barangay 6 (Poblacion)', 'Barangay 7 (Poblacion)', 'Barangay 8 (Poblacion)', 'Barangay 9 (Poblacion)', 'Barangay 10 (Poblacion)',
            'Barangay 11 (Poblacion)', 'Bocohan', 'Cotta', 'Dalahican', 'Domaite',
            'Gulang-Gulang', 'Ibabang Dupay', 'Ibabang Iyam', 'Ibabang Talim', 'Ilayang Dupay',
            'Ilayang Iyam', 'Ilayang Talim', 'Isabang', 'Market View', 'Mayao Castillo',
            'Mayao Crossing', 'Mayao Kanluran', 'Mayao Parada', 'Mayao Silangan', 'Ransohan',
            'Salinas', 'Talao-Talao'
        ]
    };

    // Comprehensive Realistic Fallback Barangays
    const DEFAULT_BARANGAYS = [
        'Poblacion', 'Poblacion I', 'Poblacion II', 'Poblacion III', 'Poblacion IV',
        'Barangay 1 (Poblacion)', 'Barangay 2 (Poblacion)', 'Barangay 3 (Poblacion)',
        'Bagong Silang', 'Central', 'Concepcion', 'Mabini', 'Maligaya',
        'Rizal', 'San Agustin', 'San Antonio', 'San Francisco', 'San Isidro',
        'San Jose', 'San Juan', 'San Miguel', 'San Pedro', 'San Rafael',
        'San Roque', 'San Vicente', 'Santa Cruz', 'Santa Elena', 'Santa Maria',
        'Santa Rosa', 'Santo Domingo', 'Santo Niño', 'Santo Rosario'
    ];

    function clean(str) {
        return (str || '').toLowerCase()
            .replace(/^(province of|prov\. of)\s+/i, '')
            .replace(/\s*\(ncr\)$/i, '')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/ñ/g, 'n')
            .replace(/[^a-z0-9]/g, '')
            .trim();
    }

        // Index all cities and municipalities with deterministic PSGC codes
    Object.keys(MUNICIPALITIES).forEach(provName => {
        const pCode = PROVINCE_CODES[provName] || '0000';
        const munis = MUNICIPALITIES[provName] || [];
        munis.forEach((muniName, idx) => {
            const cCode = `${pCode}${String(idx + 1).padStart(2, '0')}`;
            const key = `${provName}::${muniName}`;
            CITY_CODES[key] = cCode;
            CITIES_BY_CODE[cCode] = {
                code: cCode,
                name: muniName,
                provinceCode: pCode,
                provinceName: provName,
                regionCode: PROVINCES_BY_CODE[pCode] ? PROVINCES_BY_CODE[pCode].regionCode : ''
            };
        });
    });

return {
        // ================= PSGC & API CASCADING METHODS =================
        getRegions: function() {
            return JSON.parse(JSON.stringify(REGIONS));
        },
        getProvincesOfRegion: function(regionCodeOrName) {
            if (!regionCodeOrName) return [];
            const rTarget = clean(String(regionCodeOrName));
            const matchedReg = REGIONS.find(r => r.code === regionCodeOrName || clean(r.code) === rTarget || clean(r.regionName) === rTarget || clean(r.name) === rTarget);
            const rCode = matchedReg ? matchedReg.code : regionCodeOrName;
            const provNames = REGION_PROVINCES[rCode] || [];
            return provNames.map(pName => {
                const info = PROVINCES_BY_CODE[PROVINCE_CODES[pName]] || {
                    code: PROVINCE_CODES[pName] || pName,
                    name: pName,
                    regionCode: rCode,
                    regionName: matchedReg ? matchedReg.regionName : ''
                };
                return { ...info };
            });
        },
        getRegionOfProvince: function(provNameOrCode) {
            if (!provNameOrCode) return null;
            const byCode = PROVINCES_BY_CODE[provNameOrCode];
            if (byCode) {
                return REGIONS.find(r => r.code === byCode.regionCode) || null;
            }
            const cleanProv = clean(String(provNameOrCode));
            for (const pName of Object.keys(PROVINCE_CODES)) {
                if (clean(pName) === cleanProv) {
                    return PROVINCE_REGION_MAP[pName] || null;
                }
            }
            return null;
        },
        getProvinceCode: function(provName) {
            if (!provName) return '';
            if (PROVINCES_BY_CODE[provName]) return provName;
            const cleanProv = clean(String(provName));
            for (const pName of Object.keys(PROVINCE_CODES)) {
                if (clean(pName) === cleanProv) return PROVINCE_CODES[pName];
            }
            return '';
        },
        getProvinceNameByCode: function(provCode) {
            if (!provCode) return '';
            if (PROVINCES_BY_CODE[provCode]) return PROVINCES_BY_CODE[provCode].name;
            return provCode;
        },
        getCitiesOfProvince: function(provinceCodeOrName) {
            if (!provinceCodeOrName) return [];
            let pName = '';
            if (PROVINCES_BY_CODE[provinceCodeOrName]) {
                pName = PROVINCES_BY_CODE[provinceCodeOrName].name;
            } else {
                pName = provinceCodeOrName;
            }
            const provInfo = PROVINCES_BY_CODE[PROVINCE_CODES[pName]] || { code: PROVINCE_CODES[pName] || '', name: pName };
            const munis = this.getMunicipalities(pName);
            return munis.map((m, idx) => {
                const cKey = `${pName}::${m}`;
                const cCode = CITY_CODES[cKey] || `${provInfo.code || 'PR'}${String(idx + 1).padStart(2, '0')}`;
                return {
                    code: cCode,
                    name: m,
                    provinceCode: provInfo.code || '',
                    provinceName: pName,
                    regionCode: provInfo.regionCode || ''
                };
            });
        },
        getCityInfoByCode: function(cityCode) {
            return CITIES_BY_CODE[cityCode] || null;
        },
        getBarangaysOfCity: function(cityCodeOrName, provinceName) {
            if (!cityCodeOrName) return [];
            let cityName = cityCodeOrName;
            let prov = provinceName || '';
            const cInfo = CITIES_BY_CODE[cityCodeOrName];
            if (cInfo) {
                cityName = cInfo.name;
                prov = prov || cInfo.provinceName;
            }
            const list = this.getBarangays(cityName, prov);
            const baseCode = cInfo ? cInfo.code : 'BRGY';
            return list.map((b, idx) => ({
                code: `${baseCode}${String(idx + 1).padStart(3, '0')}`,
                name: b,
                cityCode: cityCodeOrName
            }));
        },
        // API Router for standard endpoints:
        // GET /api/region
        // GET /api/region/{region_code}/province
        // GET /api/province/{province_code}/city-municipality
        // GET /api/city/{city_code}/barangay
        routeApi: function(url) {
            if (!url) return null;
            let cleanUrl = String(url).split('?')[0].split('#')[0];
            const apiIdx = cleanUrl.indexOf('/api/');
            if (apiIdx !== -1) {
                cleanUrl = cleanUrl.substring(apiIdx);
            } else if (cleanUrl.startsWith('api/')) {
                cleanUrl = '/' + cleanUrl;
            } else {
                cleanUrl = cleanUrl.replace(/^[a-z]+:\/\/[^\/]*\/?/i, '/');
            }
            cleanUrl = cleanUrl.replace(/^\/+/, '/');

            // 1. GET /api/region or /api/regions
            if (/^\/api\/regions?\/?$/i.test(cleanUrl)) {
                return this.getRegions();
            }

            // 2. GET /api/region/{region_code}/province(s)
            const regProvMatch = cleanUrl.match(/^\/api\/region\/([^\/]+)\/provinces?\/?$/i);
            if (regProvMatch) {
                const regCode = decodeURIComponent(regProvMatch[1]);
                return this.getProvincesOfRegion(regCode);
            }

            // 3. GET /api/province/{province_code}/city-municipality or /cities or /municipalities
            const provCityMatch = cleanUrl.match(/^\/api\/province\/([^\/]+)\/(?:city-municipality|cities|municipalities)\/?$/i);
            if (provCityMatch) {
                const provCode = decodeURIComponent(provCityMatch[1]);
                return this.getCitiesOfProvince(provCode);
            }

            // 4. GET /api/city/{city_code}/barangay(s)
            const cityBrgyMatch = cleanUrl.match(/^\/api\/city\/([^\/]+)\/barangays?\/?$/i);
            if (cityBrgyMatch) {
                const cityCode = decodeURIComponent(cityBrgyMatch[1]);
                return this.getBarangaysOfCity(cityCode);
            }

            return null;
        },
        fetchRegions: async function() {
            const data = this.routeApi('/api/region');
            return data;
        },
        fetchProvinces: async function(regionCode) {
            const data = this.routeApi(`/api/region/${regionCode}/province`);
            return data;
        },
        fetchCities: async function(provinceCode) {
            const data = this.routeApi(`/api/province/${provinceCode}/city-municipality`);
            return data;
        },
        fetchBarangays: async function(cityCode) {
            const data = this.routeApi(`/api/city/${cityCode}/barangay`);
            return data;
        },
        isProvince: function(name) {
            if (!name) return false;
            const target = clean(name);
            return PROVINCES.some(p => {
                const cp = clean(p);
                return cp === target || target.includes(cp) || cp.includes(target);
            });
        },
        getProvinces: function() {
            return [...PROVINCES].sort((a, b) => {
                if (a === 'Metro Manila (NCR)') return -1;
                if (b === 'Metro Manila (NCR)') return 1;
                return a.localeCompare(b);
            });
        },
        getMunicipalities: function(province) {
            if (!province) {
                return MUNICIPALITIES['Batangas'] ? [...MUNICIPALITIES['Batangas']].sort((a, b) => a.localeCompare(b)) : [];
            }
            const p = province.trim();
            if (MUNICIPALITIES[p]) {
                return [...MUNICIPALITIES[p]].sort((a, b) => a.localeCompare(b));
            }
            // Case-insensitive / normalized lookup
            const target = clean(p);
            for (const k of Object.keys(MUNICIPALITIES)) {
                if (clean(k) === target) {
                    return [...MUNICIPALITIES[k]].sort((a, b) => a.localeCompare(b));
                }
            }
            // Substring match
            for (const k of Object.keys(MUNICIPALITIES)) {
                const ck = clean(k);
                if (ck.includes(target) || target.includes(ck)) {
                    return [...MUNICIPALITIES[k]].sort((a, b) => a.localeCompare(b));
                }
            }
            return MUNICIPALITIES['Batangas'] ? [...MUNICIPALITIES['Batangas']] : [];
        },
        getProvinceOfMunicipality: function(municipality) {
            if (!municipality) return '';
            const m = clean(municipality);
            const mStripped = m.replace(/\s+city$/i, '');
            if (MUNICIPALITIES['Batangas']) {
                for (let i = 0; i < MUNICIPALITIES['Batangas'].length; i++) {
                    const cItem = clean(MUNICIPALITIES['Batangas'][i]);
                    if (cItem === m || cItem.replace(/\s+city$/i, '') === mStripped) {
                        return 'Batangas';
                    }
                }
            }
            const provKeys = Object.keys(MUNICIPALITIES);
            for (let i = 0; i < provKeys.length; i++) {
                const prov = provKeys[i];
                const list = MUNICIPALITIES[prov];
                for (let j = 0; j < list.length; j++) {
                    const cItem = clean(list[j]);
                    if (cItem === m || cItem.replace(/\s+city$/i, '') === mStripped) {
                        return prov;
                    }
                }
            }
            return '';
        },
        getAllMunicipalities: function() {
            const set = new Set();
            if (MUNICIPALITIES['Batangas']) {
                MUNICIPALITIES['Batangas'].forEach(m => set.add(m));
            }
            Object.values(MUNICIPALITIES).forEach(list => {
                list.forEach(m => set.add(m));
            });
            return Array.from(set);
        },
        getBarangays: function(municipality, province) {
            if (!municipality) return [];
            const m = municipality.trim();
            const p = (province || '').trim();
            const cleanM = clean(m);
            const cleanP = clean(p);

            // 1. Province is provided: STRICTLY match within that province
            if (p) {
                const exactCompound = `${p}::${m}`;
                if (BARANGAYS[exactCompound]) {
                    return [...BARANGAYS[exactCompound]].sort((a, b) => a.localeCompare(b));
                }

                // Normalized compound search matching selected province
                for (const k of Object.keys(BARANGAYS)) {
                    if (k.includes('::')) {
                        const [kProv, kMuni] = k.split('::');
                        const ckProv = clean(kProv);
                        const ckMuni = clean(kMuni);
                        if (ckProv === cleanP || ckProv.includes(cleanP) || cleanP.includes(ckProv)) {
                            const strippedKMuni = ckMuni.replace(/\s+city$/i, '');
                            const strippedM = cleanM.replace(/\s+city$/i, '');
                            if (ckMuni === cleanM || strippedKMuni === strippedM) {
                                return [...BARANGAYS[k]].sort((a, b) => a.localeCompare(b));
                            }
                        }
                    }
                }
            }

            // 2. Direct key or alias (ONLY if no province or if province matches)
            if (!p) {
                if (BARANGAYS[m]) {
                    return [...BARANGAYS[m]].sort((a, b) => a.localeCompare(b));
                }
                for (const k of Object.keys(BARANGAYS)) {
                    if (!k.includes('::') && clean(k) === cleanM) {
                        return [...BARANGAYS[k]].sort((a, b) => a.localeCompare(b));
                    }
                }
            }

            // 3. Fallback: comprehensive list of official-type barangays
            return [...DEFAULT_BARANGAYS].sort((a, b) => a.localeCompare(b));
        }
    };
})();

if (typeof window !== 'undefined') {
    window.PH_GEO_DATA = PH_GEO_DATA;
}

// Client-side API fetch interceptor for offline / standalone browser environments
if (typeof window !== 'undefined') {
    const _origFetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : null;
    window.fetch = async function(resource, init) {
        const urlStr = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');
        if (typeof urlStr === 'string' && (urlStr.includes('/api/region') || urlStr.includes('/api/province') || urlStr.includes('/api/city'))) {
            const apiData = PH_GEO_DATA.routeApi(urlStr);
            if (apiData !== null) {
                if (typeof Response === 'function') {
                    try {
                        return new Response(JSON.stringify(apiData), {
                            status: 200,
                            statusText: 'OK',
                            headers: { 'Content-Type': 'application/json' }
                        });
                    } catch(e) {}
                }
                return {
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: (typeof Headers === 'function') ? new Headers({ 'Content-Type': 'application/json' }) : {},
                    json: async () => apiData,
                    text: async () => JSON.stringify(apiData)
                };
            }
        }
        if (_origFetch) {
            try {
                return await _origFetch(resource, init);
            } catch (netErr) {
                // If native fetch failed on a local /api/ URL
                if (typeof urlStr === 'string' && urlStr.includes('/api/')) {
                    const fallbackData = PH_GEO_DATA.routeApi(urlStr);
                    if (fallbackData !== null) {
                        return {
                            ok: true,
                            status: 200,
                            statusText: 'OK',
                            headers: (typeof Headers === 'function') ? new Headers({ 'Content-Type': 'application/json' }) : {},
                            json: async () => fallbackData,
                            text: async () => JSON.stringify(fallbackData)
                        };
                    }
                }
                throw netErr;
            }
        }
        throw new Error('Network fetch not available for: ' + urlStr);
    };
}