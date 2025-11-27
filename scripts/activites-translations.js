const dataTranslations = {
    fr: {
        title: "Activités",
        subtitle: "Découvrez les lieux incontournables et les activités à proximité",
        introduction: "Entre lacs majestueux, paysages préservés, savoir-faire locaux et aventures en plein air, notre région a tant à offrir. Découvrez notre sélection de 26 activités incontournables autour du logement.",
        
        // --- 13 ANCIENNES ACTIVITÉS (Celles-ci marchaient déjà) ---
        lac_remoray_title: "Lac de Remoray",
        lac_remoray_description: "Réserve naturelle protégée, idéale pour les balades, l’observation des oiseaux et des moments de calme au bord de l’eau.",
        maison_reserve_title: "La Maison de la Réserve",
        maison_reserve_description: "Un lieu dédié à la découverte de la faune et de la flore locales, parfait pour les amoureux de la nature. Expositions, sentiers de randonnée et activités pédagogiques vous y attendent.",
        fonderie_cloches_title: "Fonderie de Cloches Obertino",
        fonderie_cloches_description: "Découvrez l’art de la fabrication des cloches dans cette fonderie renommée. Des visites guidées permettent d’explorer ce savoir-faire traditionnel.",
        chateau_joux_title: "Château de Joux",
        chateau_joux_description: "Forteresse médiévale avec une vue panoramique et des visites guidées retraçant mille ans d’histoire.",
        fort_saint_antoine_title: "Fort Saint-Antoine",
        fort_saint_antoine_description: "Un lieu unique d’affinage du Comté, à visiter pour découvrir les secrets de fabrication de ce fromage d’exception.",
        station_metabief_title: "Station de Métabief",
        station_metabief_description: "Activités d’hiver (ski, raquettes) et d’été (VTT, luge, randonnée) pour les amateurs de nature et de sensations fortes.",
        source_bleue_title: "Source Bleue",
        source_bleue_description: "Petite promenade agréable menant à une source naturelle nichée dans la verdure. Un lieu paisible pour se détendre et profiter de la nature, accessible depuis Malbuisson.",
        luge_rails_title: "Luge sur Rails",
        luge_rails_description: "Une activité ludique pour toute la famille à Métabief. Dévalez les pentes en toute sécurité sur des rails, sensations garanties !",
        accrobranche_metabief_title: "Accrobranche à Métabief",
        accrobranche_metabief_description: "Parcours aventure dans les arbres avec différents niveaux pour petits et grands. Sensations garanties au cœur de la forêt de Métabief.",
        lac_saint_point_title: "Lac Saint-Point",
        lac_saint_point_description: "Troisième plus grand lac naturel de France, idéal pour la baignade, les balades à pied ou à vélo, et les activités nautiques. De nombreux accès depuis Malbuisson, Saint-Point et Labergement.",
        distillerie_guy_title: "Distillerie Guy",
        distillerie_guy_description: "Visitez la dernière distillerie artisanale d’absinthe à Pontarlier. Découvrez l’histoire de cette boisson emblématique et dégustez des produits typiques du Haut-Doubs.",
        maison_michaud_title: "Maison Michaud",
        maison_michaud_description: "Plongez dans la vie rurale d’autrefois dans cette ferme comtoise transformée en écomusée. Animations toute l’année.",
        mont_dor_title: "Mont d’Or",
        mont_dor_description: "Point culminant du Doubs. Panorama spectaculaire sur les Alpes depuis le sommet. Accessible à pied depuis Métabief.",

        // --- 13 NOUVELLES ACTIVITÉS (IDs corrigés pour matcher le HTML) ---
        saut_doubs_title: "Le Saut du Doubs",
        saut_doubs_desc: "Une chute d’eau spectaculaire de 27 mètres située dans une gorge étroite. Accès en bateau ou par un sentier panoramique. Site impressionnant au printemps ou après les pluies.",
        
        source_doubs_title: "Source du Doubs (Mouthe)",
        source_doubs_desc: "La naissance du Doubs dans une grotte froide et humide. Petite balade simple autour de la source. Ambiance très photogénique, surtout en hiver quand tout givre.",
        
        tour_lac_title: "Tour du Lac de Saint-Point",
        tour_lac_desc: "Plusieurs itinéraires permettent de longer le lac, des variantes courtes aux boucles complètes. Forêts, roselières, plages, villages : un classique du secteur à pied ou vélo.",
        
        belvedere_2lacs_title: "Belvédère des 2 Lacs",
        belvedere_2lacs_desc: "Vue dégagée sur les lacs de Remoray et Saint-Point depuis un promontoire facile d’accès. Idéal pour photos, pique-nique rapide ou coucher de soleil.",
        
        reserve_remoray_title: "Réserve naturelle du Lac de Remoray",
        reserve_remoray_desc: "Réserve protégée abritant oiseaux rares, libellules et orchidées. Plusieurs sentiers doux permettent d’explorer ce site calme et préservé.",
        
        rucher_title: "Le Rucher des Deux Lacs",
        rucher_desc: "Production locale de miel et produits dérivés. Possibilité d’échanger sur l’apiculture et d’acheter du vrai miel du Haut-Doubs.",
        
        fromagerie_montdor_title: "Fromagerie du Mont d’Or (Métabief)",
        fromagerie_montdor_desc: "Fromagerie traditionnelle produisant le Mont d’Or AOP. Selon l’heure, vue sur les cuves ou la mise en boîte. Boutique fromagère complète.",
        
        distillerie_pernot_title: "Distillerie Les Fils d’Émile Pernot",
        distillerie_pernot_desc: "Distillerie historique, connue pour son absinthe. Visite guidée très instructive, suivie d’une dégustation des spécialités locales.",
        
        base_nautique_title: "Base nautique de Malbuisson",
        base_nautique_desc: "Espace dédié aux activités nautiques : paddle, pédalo, voile, kayak. Location du matériel en saison. Atmosphère détente en bord de lac.",
        
        vtt_elec_title: "Location VTT électrique",
        vtt_elec_desc: "Plusieurs loueurs permettent de partir explorer les sentiers du Mont-d’Or en VTT électrique. Terrain varié pour sportifs comme débutants.",
        
        peche_truite_title: "Pêche en Rivière (Truite)",
        peche_truite_desc: "Le Doubs offre de beaux parcours pour la truite fario en rivière. Eau claire, secteurs calmes, idéal pour pêcheurs débutants ou confirmés.",
        
        spa_rives_title: "Spa Les Rives Sauvages",
        spa_rives_desc: "Spa premium avec piscine panoramique, sauna, hammam et soins. Vue imprenable sur le lac.",
        
        chiens_traineau_title: "Balade en chiens de traîneau",
        chiens_traineau_desc: "Activité hivernale incontournable : baptême en traîneau ou initiation à la conduite. Expérience immersive avec les chiens sur un parcours forestier typique.",

        et_plus_encore_title: "Et plus encore ...",
        et_plus_encore_description: "Découvrez encore plus d'activités et de lieux à explorer en visitant le site de l'office du tourisme de Malbuisson.",
        
        // Variables communes
        btn_website: "Site officiel",
        btn_maps: "Y aller",
        info_min: "min",
        info_km: "km",

        // Footer
        footer_contact_title: "Nous contacter",
        footer_links_title: "Liens rapides",
        footer_link_home: "Accueil",
        footer_link_rates: "Tarifs et Disponibilités",
        footer_link_activities: "Activités",
        footer_link_legal: "Mentions Légales",
        footer_contact_form: "Formulaire de contact",
        footer_follow_title: "Réserver sur Airbnb",
        footer_airbnb_text: "Consultez nos avis et réservez en toute sécurité.",
        footer_rights: "Tous droits réservés"
    },
    en: {
        title: "Activities",
        subtitle: "Discover must-see places and nearby activities",
        introduction: "Between majestic lakes, preserved landscapes, local craftsmanship, and outdoor adventures, our region has so much to offer. Discover our selection of 26 must-see activities around the accommodation.",
        
        lac_remoray_title: "Lac de Remoray",
        lac_remoray_description: "A protected natural reserve, ideal for walks, bird watching, and peaceful moments by the water.",
        maison_reserve_title: "La Maison de la Réserve",
        maison_reserve_description: "A place dedicated to discovering local fauna and flora, perfect for nature lovers. Exhibitions, hiking trails, and educational activities await you.",
        fonderie_cloches_title: "Obertino Bell Foundry",
        fonderie_cloches_description: "Discover the art of bell-making in this renowned foundry. Guided tours allow you to explore this traditional craftsmanship.",
        chateau_joux_title: "Château de Joux",
        chateau_joux_description: "A medieval fortress with a panoramic view and guided tours retracing a thousand years of history.",
        fort_saint_antoine_title: "Fort Saint-Antoine",
        fort_saint_antoine_description: "A unique place for aging Comté cheese, visit to discover the secrets of making this exceptional cheese.",
        station_metabief_title: "Métabief Station",
        station_metabief_description: "Winter activities (skiing, snowshoeing) and summer activities (mountain biking, sledding, hiking) for nature and thrill enthusiasts.",
        source_bleue_title: "Source Bleue",
        source_bleue_description: "A pleasant short walk leading to a natural spring nestled in greenery. A peaceful place to relax and enjoy nature, accessible from Malbuisson.",
        luge_rails_title: "Rail Tobogganing",
        luge_rails_description: "A fun activity for the whole family in Métabief. Rush down the slopes safely on rails, thrills guaranteed!",
        accrobranche_metabief_title: "Tree Climbing in Métabief",
        accrobranche_metabief_description: "Adventure courses in the trees with different levels for young and old. Guaranteed thrills in the heart of the Métabief forest.",
        lac_saint_point_title: "Lac Saint-Point",
        lac_saint_point_description: "The third largest natural lake in France, ideal for swimming, walking, cycling, and water activities. Many access points from Malbuisson, Saint-Point, and Labergement.",
        distillerie_guy_title: "Guy Distillery",
        distillerie_guy_description: "Visit the last artisanal absinthe distillery in Pontarlier. Discover the history of this iconic drink and taste typical products from Haut-Doubs.",
        maison_michaud_title: "Maison Michaud",
        maison_michaud_description: "Immerse yourself in the rural life of yesteryear in this Comtoise farm turned eco-museum. Events all year round.",
        mont_dor_title: "Mont d’Or",
        mont_dor_description: "The highest point in Doubs. Spectacular panorama of the Alps from the summit. Accessible on foot from Métabief.",

        // --- NEW 13 ACTIVITIES ---
        saut_doubs_title: "Saut du Doubs Waterfall",
        saut_doubs_desc: "A spectacular 27-meter waterfall located in a narrow gorge. Accessible by boat or panoramic trail. Impressive in spring or after rain.",
        
        source_doubs_title: "Source of the Doubs (Mouthe)",
        source_doubs_desc: "The birth of the Doubs river in a cold and humid cave. Simple short walk around the source. Very photogenic atmosphere, especially in winter when frozen.",
        
        tour_lac_title: "Saint-Point Lake Tour",
        tour_lac_desc: "Several itineraries allow you to walk along the lake, from short variants to complete loops. Forests, reed beds, beaches, villages: a classic of the sector on foot or bike.",
        
        belvedere_2lacs_title: "Belvedere of the 2 Lakes",
        belvedere_2lacs_desc: "Unobstructed view of lakes Remoray and Saint-Point from an easily accessible promontory. Ideal for photos, quick picnics, or sunsets.",
        
        reserve_remoray_title: "Lac de Remoray Nature Reserve",
        reserve_remoray_desc: "Protected reserve sheltering rare birds, dragonflies, and orchids. Several gentle trails allow you to explore this quiet and preserved site.",
        
        rucher_title: "The 2 Lakes Apiary",
        rucher_desc: "Local production of honey and derived products. Opportunity to discuss beekeeping and buy real Haut-Doubs honey.",
        
        fromagerie_montdor_title: "Mont d’Or Cheese Dairy",
        fromagerie_montdor_desc: "Traditional cheese dairy producing Mont d’Or AOP. Depending on the time, view of the vats or boxing. Complete cheese shop.",
        
        distillerie_pernot_title: "Émile Pernot Distillery",
        distillerie_pernot_desc: "Historic distillery known for its absinthe. Very instructive guided tour, followed by a tasting of local specialties.",
        
        base_nautique_title: "Malbuisson Nautical Base",
        base_nautique_desc: "Area dedicated to water activities: paddle, pedal boat, sailing, kayak. Equipment rental in season. Relaxing atmosphere by the lake.",
        
        vtt_elec_title: "E-Mountain Bike Rental",
        vtt_elec_desc: "Several rental companies allow you to explore the Mont-d’Or trails on electric mountain bikes. Varied terrain for athletes and beginners alike.",
        
        peche_truite_title: "River Fishing (Trout)",
        peche_truite_desc: "The Doubs offers beautiful courses for brown trout in the river. Clear water, calm sectors, ideal for beginners or experienced fishermen.",
        
        spa_rives_title: "Spa Les Rives Sauvages",
        spa_rives_desc: "Premium spa with panoramic pool, sauna, hammam, and treatments. Breathtaking view of the lake.",
        
        chiens_traineau_title: "Dog Sledding",
        chiens_traineau_desc: "Must-do winter activity: sled baptism or driving initiation. Immersive experience with the dogs on a typical forest course.",

        et_plus_encore_title: "And more ...",
        et_plus_encore_description: "Discover even more activities and places to explore by visiting the Malbuisson tourist office website.",

        btn_website: "Official website",
        btn_maps: "Get directions",
        info_min: "min",
        info_km: "km",

        // Footer
        footer_contact_title: "Contact us",
        footer_links_title: "Quick Links",
        footer_link_home: "Home",
        footer_link_rates: "Rates and Availability",
        footer_link_activities: "Activities",
        footer_link_legal: "Legal Notice",
        footer_contact_form: "Contact Form",
        footer_follow_title: "Book on Airbnb",
        footer_airbnb_text: "Check our reviews and book securely.",
        footer_rights: "All rights reserved"
    },
    de: {
        title: "Aktivitäten",
        subtitle: "Entdecken Sie die Sehenswürdigkeiten und Aktivitäten in der Nähe",
        introduction: "Zwischen majestätischen Seen, unberührten Landschaften, lokalem Handwerk und Outdoor-Abenteuern hat unsere Region so viel zu bieten. Entdecken Sie unsere Auswahl von 26 unumgänglichen Aktivitäten rund um die Unterkunft.",

        lac_remoray_title: "Lac de Remoray",
        lac_remoray_description: "Ein geschütztes Naturreservat, ideal für Spaziergänge, Vogelbeobachtungen und ruhige Momente am Wasser.",
        maison_reserve_title: "La Maison de la Réserve",
        maison_reserve_description: "Ein Ort, der der Entdeckung der lokalen Fauna und Flora gewidmet ist, perfekt für Naturliebhaber. Ausstellungen, Wanderwege und pädagogische Aktivitäten erwarten Sie.",
        fonderie_cloches_title: "Glockengießerei Obertino",
        fonderie_cloches_description: "Entdecken Sie die Kunst der Glockenherstellung in dieser renommierten Gießerei. Führungen ermöglichen es, dieses traditionelle Handwerk zu erkunden.",
        chateau_joux_title: "Château de Joux",
        chateau_joux_description: "Eine mittelalterliche Festung mit Panoramablick und Führungen, die tausend Jahre Geschichte nachzeichnen.",
        fort_saint_antoine_title: "Fort Saint-Antoine",
        fort_saint_antoine_description: "Ein einzigartiger Ort zur Reifung von Comté-Käse, besuchen Sie ihn, um die Geheimnisse der Herstellung dieses außergewöhnlichen Käses zu entdecken.",
        station_metabief_title: "Station Métabief",
        station_metabief_description: "Winteraktivitäten (Skifahren, Schneeschuhwandern) und Sommeraktivitäten (Mountainbiken, Rodeln, Wandern) für Natur- und Abenteuerliebhaber.",
        source_bleue_title: "Source Bleue",
        source_bleue_description: "Ein angenehmer kurzer Spaziergang, der zu einer natürlichen Quelle führt, die im Grünen eingebettet ist. Ein ruhiger Ort, um sich zu entspannen und die Natur zu genießen, zugänglich von Malbuisson.",
        luge_rails_title: "Sommerrodelbahn",
        luge_rails_description: "Eine lustige Aktivität für die ganze Familie in Métabief. Sausen Sie sicher auf Schienen die Hänge hinunter, Nervenkitzel garantiert!",
        accrobranche_metabief_title: "Baumklettern in Métabief",
        accrobranche_metabief_description: "Abenteuerparcours in den Bäumen mit verschiedenen Schwierigkeitsgraden für Jung und Alt. Nervenkitzel garantiert im Herzen des Waldes von Métabief.",
        lac_saint_point_title: "Lac Saint-Point",
        lac_saint_point_description: "Der drittgrößte natürliche See Frankreichs, ideal zum Schwimmen, Spazierengehen, Radfahren und für Wasseraktivitäten. Viele Zugänge von Malbuisson, Saint-Point und Labergement.",
        distillerie_guy_title: "Distillerie Guy",
        distillerie_guy_description: "Besuchen Sie die letzte handwerkliche Absinth-Destillerie in Pontarlier. Entdecken Sie die Geschichte dieses ikonischen Getränks und probieren Sie typische Produkte aus dem Haut-Doubs.",
        maison_michaud_title: "Maison Michaud",
        maison_michaud_description: "Tauchen Sie ein in das ländliche Leben von einst in diesem Comtoise-Bauernhof, der in ein Ökomuseum umgewandelt wurde. Veranstaltungen das ganze Jahr über.",
        mont_dor_title: "Mont d’Or",
        mont_dor_description: "Der höchste Punkt im Doubs. Spektakuläres Panorama auf die Alpen vom Gipfel. Zu Fuß von Métabief aus erreichbar.",

        // --- NEUE 13 AKTIVITÄTEN ---
        saut_doubs_title: "Der Saut du Doubs (Wasserfall)",
        saut_doubs_desc: "Ein spektakulärer 27 Meter hoher Wasserfall in einer engen Schlucht. Erreichbar mit dem Boot oder über einen Panoramaweg. Im Frühling oder nach Regenfällen besonders beeindruckend.",
        
        source_doubs_title: "Quelle des Doubs (Mouthe)",
        source_doubs_desc: "Der Ursprung des Doubs in einer kalten und feuchten Höhle. Einfacher kurzer Spaziergang um die Quelle. Sehr fotogen, besonders im Winter bei Frost.",
        
        tour_lac_title: "Rundweg Lac de Saint-Point",
        tour_lac_desc: "Mehrere Routen ermöglichen es, am See entlang zu gehen, von kurzen Varianten bis zu kompletten Runden. Wälder, Schilfgürtel, Strände, Dörfer: ein Klassiker der Region zu Fuß oder mit dem Fahrrad.",
        
        belvedere_2lacs_title: "Aussichtspunkt der 2 Seen",
        belvedere_2lacs_desc: "Freier Blick auf die Seen Remoray und Saint-Point von einem leicht zugänglichen Felsvorsprung. Ideal für Fotos, schnelle Picknicks oder Sonnenuntergänge.",
        
        reserve_remoray_title: "Naturschutzgebiet Lac de Remoray",
        reserve_remoray_desc: "Geschütztes Reservat mit seltenen Vögeln, Libellen und Orchideen. Mehrere sanfte Wege ermöglichen die Erkundung dieses ruhigen und bewahrten Ortes.",
        
        rucher_title: "Imkerei der zwei Seen",
        rucher_desc: "Lokale Produktion von Honig und Nebenprodukten. Möglichkeit zum Austausch über Imkerei und Kauf von echtem Haut-Doubs-Honig.",
        
        fromagerie_montdor_title: "Käserei Mont d’Or",
        fromagerie_montdor_desc: "Traditionelle Käserei, die Mont d’Or AOP herstellt. Je nach Uhrzeit Blick auf die Kessel oder das Verpacken. Kompletter Käseladen.",
        
        distillerie_pernot_title: "Destillerie Émile Pernot",
        distillerie_pernot_desc: "Historische Destillerie, bekannt für ihren Absinth. Sehr lehrreiche Führung, gefolgt von einer Verkostung lokaler Spezialitäten.",
        
        base_nautique_title: "Wassersportzentrum Malbuisson",
        base_nautique_desc: "Bereich für Wassersportaktivitäten: Paddle, Tretboot, Segeln, Kajak. Materialverleih in der Saison. Entspannte Atmosphäre am Seeufer.",
        
        vtt_elec_title: "E-Mountainbike Verleih",
        vtt_elec_desc: "Mehrere Verleiher ermöglichen es, die Wege des Mont-d’Or mit dem E-Mountainbike zu erkunden. Abwechslungsreiches Gelände für Sportler und Anfänger.",
        
        peche_truite_title: "Flussangeln (Forelle)",
        peche_truite_desc: "Der Doubs bietet schöne Strecken für Bachforellen im Fluss. Klares Wasser, ruhige Abschnitte, ideal für Anfänger oder erfahrene Angler.",
        
        spa_rives_title: "Spa Les Rives Sauvages",
        spa_rives_desc: "Premium-Spa mit Panoramapool, Sauna, Dampfbad und Anwendungen. Atemberaubender Blick auf den See.",
        
        chiens_traineau_title: "Hundeschlittenfahrt",
        chiens_traineau_desc: "Unverzichtbare Winteraktivität: Schlittentaufe oder Einführung in das Fahren. Immersives Erlebnis mit den Hunden auf einer typischen Waldstrecke.",

        et_plus_encore_title: "Und mehr ...",
        et_plus_encore_description: "Entdecken Sie noch mehr Aktivitäten und Orte, die Sie erkunden können, indem Sie die Website des Tourismusbüros von Malbuisson besuchen.",

        btn_website: "Offizielle Website",
        btn_maps: "Route",
        info_min: "Min.",
        info_km: "km",

        // Footer
        footer_contact_title: "Kontaktieren Sie uns",
        footer_links_title: "Schnelllinks",
        footer_link_home: "Startseite",
        footer_link_rates: "Preise und Verfügbarkeit",
        footer_link_activities: "Aktivitäten",
        footer_link_legal: "Impressum",
        footer_contact_form: "Kontaktformular",
        footer_follow_title: "Auf Airbnb buchen",
        footer_airbnb_text: "Bewertungen lesen und sicher buchen.",
        footer_rights: "Alle Rechte vorbehalten"
    },
    nl: {
        title: "Activiteiten",
        subtitle: "Ontdek bezienswaardigheden en activiteiten in de buurt",
        introduction: "Tussen majestueuze meren, ongerepte landschappen, lokaal vakmanschap en buitenavonturen heeft onze regio zoveel te bieden. Ontdek onze selectie van 26 onmisbare activiteiten rond de accommodatie.",

        lac_remoray_title: "Meer van Remoray",
        lac_remoray_description: "Een beschermd natuurreservaat, ideaal voor wandelingen, vogels kijken en rustige momenten aan het water.",
        maison_reserve_title: "La Maison de la Réserve",
        maison_reserve_description: "Een plek gewijd aan de ontdekking van de lokale flora en fauna, perfect voor natuurliefhebbers. Tentoonstellingen, wandelpaden en educatieve activiteiten wachten op u.",
        fonderie_cloches_title: "Klokkengieterij Obertino",
        fonderie_cloches_description: "Ontdek de kunst van het klokkengieten in deze gerenommeerde gieterij. Rondleidingen stellen u in staat dit traditionele vakmanschap te verkennen.",
        chateau_joux_title: "Kasteel van Joux",
        chateau_joux_description: "Een middeleeuws fort met een panoramisch uitzicht en rondleidingen die duizend jaar geschiedenis schetsen.",
        fort_saint_antoine_title: "Fort Saint-Antoine",
        fort_saint_antoine_description: "Een unieke plek voor het rijpen van Comté-kaas, bezoek het om de geheimen van het maken van deze uitzonderlijke kaas te ontdekken.",
        station_metabief_title: "Station Métabief",
        station_metabief_description: "Winteractiviteiten (skiën, sneeuwschoenwandelen) en zomeractiviteiten (mountainbiken, rodelen, wandelen) voor liefhebbers van natuur en sensatie.",
        source_bleue_title: "Blauwe Bron",
        source_bleue_description: "Een aangename korte wandeling die leidt naar een natuurlijke bron midden in het groen. Een rustige plek om te ontspannen en van de natuur te genieten, bereikbaar vanuit Malbuisson.",
        luge_rails_title: "Zomerrodelbaan",
        luge_rails_description: "Een leuke activiteit voor het hele gezin in Métabief. Glij veilig de hellingen af op rails, sensatie gegarandeerd!",
        accrobranche_metabief_title: "Klimpark in Métabief",
        accrobranche_metabief_description: "Avonturenparcours in de bomen met verschillende niveaus voor jong en oud. Sensatie gegarandeerd in het hart van het bos van Métabief.",
        lac_saint_point_title: "Meer van Saint-Point",
        lac_saint_point_description: "Het derde grootste natuurlijke meer van Frankrijk, ideaal om te zwemmen, wandelen, fietsen en voor wateractiviteiten. Veel toegangen vanuit Malbuisson, Saint-Point en Labergement.",
        distillerie_guy_title: "Distilleerderij Guy",
        distillerie_guy_description: "Bezoek de laatste ambachtelijke absintstokerij in Pontarlier. Ontdek de geschiedenis van deze iconische drank en proef typische producten uit de Haut-Doubs.",
        maison_michaud_title: "Maison Michaud",
        maison_michaud_description: "Dompel u onder in het landelijke leven van weleer in deze Comtoise-boerderij die is omgevormd tot ecomuseum. Evenementen het hele jaar door.",
        mont_dor_title: "Mont d’Or",
        mont_dor_description: "Het hoogste punt van de Doubs. Spectaculair panorama op de Alpen vanaf de top. Te voet bereikbaar vanuit Métabief.",

        // --- NIEUWE 13 ACTIVITEITEN ---
        saut_doubs_title: "De Saut du Doubs (Waterval)",
        saut_doubs_desc: "Een spectaculaire waterval van 27 meter in een smalle kloof. Bereikbaar per boot of via een panoramisch pad. Indrukwekkend in de lente of na regenval.",
        
        source_doubs_title: "Bron van de Doubs (Mouthe)",
        source_doubs_desc: "De geboorte van de rivier de Doubs in een koude en vochtige grot. Eenvoudige korte wandeling rond de bron. Zeer fotogeniek, vooral in de winter als het vriest.",
        
        tour_lac_title: "Ronde van het meer van Saint-Point",
        tour_lac_desc: "Verschillende routes maken het mogelijk om langs het meer te lopen, van korte varianten tot volledige lussen. Bossen, rietvelden, stranden, dorpen: een klassieker in de regio te voet of per fiets.",
        
        belvedere_2lacs_title: "Belvedere van de 2 Meren",
        belvedere_2lacs_desc: "Vrij uitzicht op de meren van Remoray en Saint-Point vanaf een gemakkelijk bereikbaar uitkijkpunt. Ideaal voor foto's, snelle picknicks of zonsondergangen.",
        
        reserve_remoray_title: "Natuurreservaat Meer van Remoray",
        reserve_remoray_desc: "Beschermd reservaat met zeldzame vogels, libellen en orchideeën. Verschillende zachte paden maken het mogelijk om deze rustige en ongerepte plek te verkennen.",
        
        rucher_title: "De Bijenstal van de Twee Meren",
        rucher_desc: "Lokale productie van honing en bijproducten. Mogelijkheid om te praten over bijenteelt en echte honing uit de Haut-Doubs te kopen.",
        
        fromagerie_montdor_title: "Kaasmakerij Mont d’Or",
        fromagerie_montdor_desc: "Traditionele kaasmakerij die Mont d’Or AOP produceert. Afhankelijk van het tijdstip, zicht op de vaten of het inpakken. Volledige kaaswinkel.",
        
        distillerie_pernot_title: "Distilleerderij Émile Pernot",
        distillerie_pernot_desc: "Historische distilleerderij, bekend om zijn absint. Zeer leerzame rondleiding, gevolgd door een proeverij van lokale specialiteiten.",
        
        base_nautique_title: "Watersportcentrum Malbuisson",
        base_nautique_desc: "Gebied gewijd aan wateractiviteiten: paddle, waterfiets, zeilen, kajak. Verhuur van materiaal in het seizoen. Ontspannen sfeer aan het meer.",
        
        vtt_elec_title: "Verhuur elektrische mountainbikes",
        vtt_elec_desc: "Verschillende verhuurders maken het mogelijk om de paden van de Mont-d’Or te verkennen op een elektrische mountainbike. Gevarieerd terrein voor zowel sporters als beginners.",
        
        peche_truite_title: "Riviervervissen (Forel)",
        peche_truite_desc: "De Doubs biedt prachtige parcoursen voor de beekforel in de rivier. Helder water, rustige sectoren, ideaal voor beginners of ervaren vissers.",
        
        spa_rives_title: "Spa Les Rives Sauvages",
        spa_rives_desc: "Premium spa met panoramisch zwembad, sauna, hamam en behandelingen. Adembenemend uitzicht op het meer.",
        
        chiens_traineau_title: "Hondensledetocht",
        chiens_traineau_desc: "Onmisbare winteractiviteit: doop met de slee of initiatie tot het mennen. Meeslepende ervaring met de honden op een typisch bospad.",

        et_plus_encore_title: "En meer ...",
        et_plus_encore_description: "Ontdek nog meer activiteiten en plaatsen om te verkennen door de website van het toeristenbureau van Malbuisson te bezoeken.",

        btn_website: "Officiële website",
        btn_maps: "Route",
        info_min: "min.",
        info_km: "km",

        // Footer
        footer_contact_title: "Neem contact op",
        footer_links_title: "Snelle links",
        footer_link_home: "Home",
        footer_link_rates: "Tarieven en beschikbaarheid",
        footer_link_activities: "Activiteiten",
        footer_link_legal: "Colofon",
        footer_contact_form: "Contactformulier",
        footer_follow_title: "Reserveren op Airbnb",
        footer_airbnb_text: "Bekijk onze beoordelingen en reserveer veilig.",
        footer_rights: "Alle rechten voorbehouden"
    },
    es: {
        title: "Actividades",
        subtitle: "Descubra los lugares imprescindibles y actividades cercanas",
        introduction: "Entre lagos majestuosos, paisajes preservados, artesanía local y aventuras al aire libre, nuestra región tiene mucho que ofrecer. Descubra nuestra selección de 26 actividades imprescindibles alrededor del alojamiento.",
        
        lac_remoray_title: "Lago de Remoray",
        lac_remoray_description: "Reserva natural protegida, ideal para paseos, observación de aves y momentos de tranquilidad junto al agua.",
        maison_reserve_title: "La Maison de la Réserve",
        maison_reserve_description: "Un lugar dedicado al descubrimiento de la fauna y flora locales, perfecto para los amantes de la naturaleza. Exposiciones, senderos y actividades educativas le esperan.",
        fonderie_cloches_title: "Fundición de Campanas Obertino",
        fonderie_cloches_description: "Descubra el arte de la fabricación de campanas en esta fundición de renombre. Las visitas guiadas permiten explorar esta artesanía tradicional.",
        chateau_joux_title: "Castillo de Joux",
        chateau_joux_description: "Una fortaleza medieval con una vista panorámica y visitas guiadas que recorren mil años de historia.",
        fort_saint_antoine_title: "Fuerte Saint-Antoine",
        fort_saint_antoine_description: "Un lugar único de maduración del queso Comté, visítelo para descubrir los secretos de fabricación de este queso excepcional.",
        station_metabief_title: "Estación de Métabief",
        station_metabief_description: "Actividades de invierno (esquí, raquetas) y de verano (bicicleta de montaña, trineo, senderismo) para los amantes de la naturaleza y las emociones fuertes.",
        source_bleue_title: "Fuente Azul",
        source_bleue_description: "Un agradable paseo corto que conduce a un manantial natural enclavado en la vegetación. Un lugar tranquilo para relajarse y disfrutar de la naturaleza, accesible desde Malbuisson.",
        luge_rails_title: "Trineo sobre raíles",
        luge_rails_description: "Una actividad divertida para toda la familia en Métabief. Deslícese por las pendientes con total seguridad sobre raíles, ¡sensaciones garantizadas!",
        accrobranche_metabief_title: "Arborismo en Métabief",
        accrobranche_metabief_description: "Recorridos de aventura en los árboles con diferentes niveles para grandes y pequeños. Emociones garantizadas en el corazón del bosque de Métabief.",
        lac_saint_point_title: "Lago Saint-Point",
        lac_saint_point_description: "El tercer lago natural más grande de Francia, ideal para nadar, caminar, andar en bicicleta y actividades acuáticas. Muchos accesos desde Malbuisson, Saint-Point y Labergement.",
        distillerie_guy_title: "Destilería Guy",
        distillerie_guy_description: "Visite la última destilería artesanal de absenta en Pontarlier. Descubra la historia de esta bebida icónica y pruebe productos típicos del Haut-Doubs.",
        maison_michaud_title: "Maison Michaud",
        maison_michaud_description: "Sumérjase en la vida rural de antaño en esta granja del Franco Condado convertida en ecomuseo. Eventos durante todo el año.",
        mont_dor_title: "Mont d’Or",
        mont_dor_description: "El punto más alto del Doubs. Panorama espectacular de los Alpes desde la cima. Accesible a pie desde Métabief.",

        // --- NUEVAS 13 ACTIVIDADES ---
        saut_doubs_title: "El Salto del Doubs",
        saut_doubs_desc: "Una espectacular cascada de 27 metros situada en una garganta estrecha. Acceso en barco o por un sendero panorámico. Impresionante en primavera o después de las lluvias.",
        
        source_doubs_title: "Fuente del Doubs (Mouthe)",
        source_doubs_desc: "El nacimiento del río Doubs en una cueva fría y húmeda. Pequeño paseo sencillo alrededor de la fuente. Ambiente muy fotogénico, especialmente en invierno cuando se congela.",
        
        tour_lac_title: "Vuelta al Lago Saint-Point",
        tour_lac_desc: "Varios itinerarios permiten bordear el lago, desde variantes cortas hasta bucles completos. Bosques, cañaverales, playas, pueblos: un clásico del sector a pie o en bicicleta.",
        
        belvedere_2lacs_title: "Mirador de los 2 Lagos",
        belvedere_2lacs_desc: "Vista despejada de los lagos de Remoray y Saint-Point desde un promontorio de fácil acceso. Ideal para fotos, picnic rápido o puestas de sol.",
        
        reserve_remoray_title: "Reserva natural del Lago de Remoray",
        reserve_remoray_desc: "Reserva protegida que alberga aves raras, libélulas y orquídeas. Varios senderos suaves permiten explorar este sitio tranquilo y preservado.",
        
        rucher_title: "El Colmenar de los Dos Lagos",
        rucher_desc: "Producción local de miel y productos derivados. Posibilidad de charlar sobre apicultura y comprar miel verdadera del Alto Doubs.",
        
        fromagerie_montdor_title: "Quesería del Mont d’Or",
        fromagerie_montdor_desc: "Quesería tradicional que produce el Mont d’Or DOP. Según la hora, vista de las cubas o el envasado. Tienda de quesos completa.",
        
        distillerie_pernot_title: "Destilería Émile Pernot",
        distillerie_pernot_desc: "Destilería histórica, conocida por su absenta. Visita guiada muy instructiva, seguida de una degustación de especialidades locales.",
        
        base_nautique_title: "Base náutica de Malbuisson",
        base_nautique_desc: "Espacio dedicado a actividades acuáticas: paddle, hidropedal, vela, kayak. Alquiler de material en temporada. Ambiente relajado junto al lago.",
        
        vtt_elec_title: "Alquiler BTT eléctrica",
        vtt_elec_desc: "Varias empresas de alquiler permiten explorar los senderos del Mont-d’Or en BTT eléctrica. Terreno variado tanto para deportistas como para principiantes.",
        
        peche_truite_title: "Pesca en Río (Trucha)",
        peche_truite_desc: "El Doubs ofrece hermosos tramos para la trucha común en el río. Agua clara, sectores tranquilos, ideal para pescadores principiantes o confirmados.",
        
        spa_rives_title: "Spa Les Rives Sauvages",
        spa_rives_desc: "Spa premium con piscina panorámica, sauna, hammam y tratamientos. Vista impresionante sobre el lago.",
        
        chiens_traineau_title: "Paseo en trineo de perros",
        chiens_traineau_desc: "Actividad invernal imprescindible: bautismo en trineo o iniciación a la conducción. Experiencia inmersiva con los perros en un recorrido forestal típico.",

        et_plus_encore_title: "Y más ...",
        et_plus_encore_description: "Descubra aún más actividades y lugares para explorar visitando el sitio web de la oficina de turismo de Malbuisson.",

        btn_website: "Sitio oficial",
        btn_maps: "Cómo llegar",
        info_min: "min",
        info_km: "km",

        // Footer
        footer_contact_title: "Contáctanos",
        footer_links_title: "Enlaces rápidos",
        footer_link_home: "Inicio",
        footer_link_rates: "Tarifas y Disponibilidad",
        footer_link_activities: "Actividades",
        footer_link_legal: "Aviso legal",
        footer_contact_form: "Formulario de contacto",
        footer_follow_title: "Reservar en Airbnb",
        footer_airbnb_text: "Lee nuestras reseñas y reserva con seguridad.",
        footer_rights: "Todos los derechos reservados"
    },
    it: {
        title: "Attività",
        subtitle: "Scoprite i luoghi imperdibili e le attività nelle vicinanze",
        introduction: "Tra laghi maestosi, paesaggi incontaminati, artigianato locale e avventure all'aria aperta, la nostra regione ha molto da offrire. Scoprite la nostra selezione di 26 attività imperdibili nei dintorni dell'alloggio.",

        lac_remoray_title: "Lago di Remoray",
        lac_remoray_description: "Riserva naturale protetta, ideale per passeggiate, birdwatching e momenti di tranquillità in riva all'acqua.",
        maison_reserve_title: "La Maison de la Réserve",
        maison_reserve_description: "Un luogo dedicato alla scoperta della fauna e della flora locali, perfetto per gli amanti della natura. Mostre, sentieri escursionistici e attività didattiche vi aspettano.",
        fonderie_cloches_title: "Fonderia di Campane Obertino",
        fonderie_cloches_description: "Scoprite l'arte della fabbricazione delle campane in questa rinomata fonderia. Le visite guidate permettono di esplorare questo artigianato tradizionale.",
        chateau_joux_title: "Castello di Joux",
        chateau_joux_description: "Una fortezza medievale con una vista panoramica e visite guidate che ripercorrono mille anni di storia.",
        fort_saint_antoine_title: "Forte Saint-Antoine",
        fort_saint_antoine_description: "Un luogo unico per la stagionatura del formaggio Comté, visitatelo per scoprire i segreti della produzione di questo formaggio eccezionale.",
        station_metabief_title: "Stazione di Métabief",
        station_metabief_description: "Attività invernali (sci, ciaspole) ed estive (mountain bike, slittino, escursionismo) per gli amanti della natura e delle emozioni forti.",
        source_bleue_title: "Fonte Blu",
        source_bleue_description: "Una piacevole breve passeggiata che porta a una sorgente naturale immersa nel verde. Un luogo tranquillo per rilassarsi e godersi la natura, accessibile da Malbuisson.",
        luge_rails_title: "Slittino su rotaia",
        luge_rails_description: "Un'attività divertente per tutta la famiglia a Métabief. Scendete le piste in tutta sicurezza su rotaie, emozioni garantite!",
        accrobranche_metabief_title: "Parco Avventura a Métabief",
        accrobranche_metabief_description: "Percorsi avventura sugli alberi con diversi livelli per grandi e piccini. Emozioni garantite nel cuore della foresta di Métabief.",
        lac_saint_point_title: "Lago di Saint-Point",
        lac_saint_point_description: "Il terzo lago naturale più grande di Francia, ideale per nuotare, camminare, andare in bicicletta e attività acquatiche. Molti accessi da Malbuisson, Saint-Point e Labergement.",
        distillerie_guy_title: "Distilleria Guy",
        distillerie_guy_description: "Visitate l'ultima distilleria artigianale di assenzio a Pontarlier. Scoprite la storia di questa bevanda iconica e assaggiate prodotti tipici dell'Alto Doubs.",
        maison_michaud_title: "Maison Michaud",
        maison_michaud_description: "Immergetevi nella vita rurale di un tempo in questa fattoria della Franca Contea trasformata in ecomuseo. Eventi tutto l'anno.",
        mont_dor_title: "Mont d’Or",
        mont_dor_description: "Il punto più alto del Doubs. Panorama spettacolare sulle Alpi dalla cima. Accessibile a piedi da Métabief.",

        // --- NUOVE 13 ATTIVITÀ ---
        saut_doubs_title: "Il Salto del Doubs (Cascata)",
        saut_doubs_desc: "Una spettacolare cascata di 27 metri situata in una gola stretta. Accesso in barca o tramite un sentiero panoramico. Impressionante in primavera o dopo le piogge.",
        
        source_doubs_title: "Sorgente del Doubs (Mouthe)",
        source_doubs_desc: "La nascita del fiume Doubs in una grotta fredda e umida. Semplice breve passeggiata intorno alla sorgente. Atmosfera molto fotogenica, soprattutto in inverno quando gela.",
        
        tour_lac_title: "Giro del Lago di Saint-Point",
        tour_lac_desc: "Diversi itinerari permettono di costeggiare il lago, da varianti brevi a giri completi. Foreste, canneti, spiagge, villaggi: un classico della zona a piedi o in bici.",
        
        belvedere_2lacs_title: "Belvedere dei 2 Laghi",
        belvedere_2lacs_desc: "Vista aperta sui laghi di Remoray e Saint-Point da un promontorio facilmente accessibile. Ideale per foto, picnic veloci o tramonti.",
        
        reserve_remoray_title: "Riserva naturale del Lago di Remoray",
        reserve_remoray_desc: "Riserva protetta che ospita uccelli rari, libellule e orchidee. Diversi sentieri dolci permettono di esplorare questo sito calmo e preservato.",
        
        rucher_title: "L'Apiario dei Due Laghi",
        rucher_desc: "Produzione locale di miele e prodotti derivati. Possibilità di discutere di apicoltura e acquistare vero miele dell'Alto Doubs.",
        
        fromagerie_montdor_title: "Caseificio del Mont d’Or",
        fromagerie_montdor_desc: "Caseificio tradizionale che produce il Mont d’Or DOP. A seconda dell'ora, vista sulle vasche o sul confezionamento. Negozio di formaggi completo.",
        
        distillerie_pernot_title: "Distilleria Émile Pernot",
        distillerie_pernot_desc: "Distilleria storica, nota per il suo assenzio. Visita guidata molto istruttiva, seguita da una degustazione di specialità locali.",
        
        base_nautique_title: "Base nautica di Malbuisson",
        base_nautique_desc: "Spazio dedicato alle attività nautiche: paddle, pedalò, vela, kayak. Noleggio attrezzature in stagione. Atmosfera rilassante in riva al lago.",
        
        vtt_elec_title: "Noleggio MTB elettrica",
        vtt_elec_desc: "Diversi noleggiatori permettono di partire all'esplorazione dei sentieri del Mont-d’Or in MTB elettrica. Terreno vario per sportivi e principianti.",
        
        peche_truite_title: "Pesca di Fiume (Trota)",
        peche_truite_desc: "Il Doubs offre bellissimi percorsi per la trota fario nel fiume. Acqua limpida, settori calmi, ideale per pescatori principianti o esperti.",
        
        spa_rives_title: "Spa Les Rives Sauvages",
        spa_rives_desc: "Spa premium con piscina panoramica, sauna, hammam e trattamenti. Vista mozzafiato sul lago.",
        
        chiens_traineau_title: "Giro in slitta trainata da cani",
        chiens_traineau_desc: "Attività invernale imperdibile: battesimo in slitta o iniziazione alla guida. Esperienza immersiva con i cani su un tipico percorso forestale.",

        et_plus_encore_title: "E altro ancora ...",
        et_plus_encore_description: "Scoprite ancora più attività e luoghi da esplorare visitando il sito web dell'ufficio turistico di Malbuisson.",

        btn_website: "Sito ufficiale",
        btn_maps: "Indicazioni",
        info_min: "min",
        info_km: "km",

        // Footer
        footer_contact_title: "Contattaci",
        footer_links_title: "Link rapidi",
        footer_link_home: "Home",
        footer_link_rates: "Tariffe e Disponibilità",
        footer_link_activities: "Attività",
        footer_link_legal: "Note legali",
        footer_contact_form: "Modulo di contatto",
        footer_follow_title: "Prenota su Airbnb",
        footer_airbnb_text: "Leggi le nostre recensioni e prenota in sicurezza.",
        footer_rights: "Tutti i diritti riservati"
    },
    pt: {
        title: "Atividades",
        subtitle: "Descubra os locais imperdíveis e atividades nas proximidades",
        introduction: "Entre lagos majestosos, paisagens preservadas, artesanato local e aventuras ao ar livre, a nossa região tem muito para oferecer. Descubra a nossa seleção de 26 atividades imperdíveis à volta do alojamento.",
        
        lac_remoray_title: "Lago de Remoray",
        lac_remoray_description: "Reserva natural protegida, ideal para passeios, observação de aves e momentos de tranquilidade à beira da água.",
        maison_reserve_title: "La Maison de la Réserve",
        maison_reserve_description: "Um lugar dedicado à descoberta da fauna e flora locais, perfeito para os amantes da natureza. Exposições, trilhos e atividades educativas esperam por si.",
        fonderie_cloches_title: "Fundição de Sinos Obertino",
        fonderie_cloches_description: "Descubra a arte do fabrico de sinos nesta fundição de renome. As visitas guiadas permitem explorar este artesanato tradicional.",
        chateau_joux_title: "Castelo de Joux",
        chateau_joux_description: "Uma fortaleza medieval com uma vista panorâmica e visitas guiadas que retraçam mil anos de história.",
        fort_saint_antoine_title: "Forte Saint-Antoine",
        fort_saint_antoine_description: "Um local único de cura do queijo Comté, visite para descobrir os segredos do fabrico deste queijo excecional.",
        station_metabief_title: "Estação de Métabief",
        station_metabief_description: "Atividades de inverno (esqui, raquetes) e de verão (BTT, trenó, caminhadas) para os amantes da natureza e de emoções fortes.",
        source_bleue_title: "Fonte Azul",
        source_bleue_description: "Um agradável passeio curto que leva a uma nascente natural aninhada no verde. Um lugar tranquilo para relaxar e desfrutar da natureza, acessível a partir de Malbuisson.",
        luge_rails_title: "Trenó sobre carris",
        luge_rails_description: "Uma atividade divertida para toda a família em Métabief. Desça as encostas em segurança sobre carris, sensações garantidas!",
        accrobranche_metabief_title: "Arborismo em Métabief",
        accrobranche_metabief_description: "Percursos de aventura nas árvores com diferentes níveis para miúdos e graúdos. Emoções garantidas no coração da floresta de Métabief.",
        lac_saint_point_title: "Lago de Saint-Point",
        lac_saint_point_description: "O terceiro maior lago natural de França, ideal para nadar, caminhar, andar de bicicleta e atividades aquáticas. Muitos acessos a partir de Malbuisson, Saint-Point e Labergement.",
        distillerie_guy_title: "Destilaria Guy",
        distillerie_guy_description: "Visite a última destilaria artesanal de absinto em Pontarlier. Descubra a história desta bebida icónica e prove produtos típicos do Haut-Doubs.",
        maison_michaud_title: "Maison Michaud",
        maison_michaud_description: "Mergulhe na vida rural de outrora nesta quinta de Comtoise transformada em ecomuseu. Eventos durante todo o ano.",
        mont_dor_title: "Mont d’Or",
        mont_dor_description: "O ponto mais alto do Doubs. Panorama espetacular dos Alpes a partir do cume. Acessível a pé a partir de Métabief.",

        // --- NOVAS 13 ATIVIDADES ---
        saut_doubs_title: "O Salto do Doubs (Cascata)",
        saut_doubs_desc: "Uma espetacular cascata de 27 metros situada num desfiladeiro estreito. Acesso de barco ou por um trilho panorâmico. Impressionante na primavera ou após as chuvas.",
        
        source_doubs_title: "Nascente do Doubs (Mouthe)",
        source_doubs_desc: "O nascimento do rio Doubs numa gruta fria e húmida. Pequeno passeio simples à volta da nascente. Ambiente muito fotogénico, especialmente no inverno quando gela.",
        
        tour_lac_title: "Volta ao Lago de Saint-Point",
        tour_lac_desc: "Vários itinerários permitem percorrer o lago, desde variantes curtas a voltas completas. Florestas, canaviais, praias, aldeias: um clássico da zona a pé ou de bicicleta.",
        
        belvedere_2lacs_title: "Miradouro dos 2 Lagos",
        belvedere_2lacs_desc: "Vista desafogada sobre os lagos de Remoray e Saint-Point a partir de um promontório de fácil acesso. Ideal para fotos, piqueniques rápidos ou pores do sol.",
        
        reserve_remoray_title: "Reserva natural do Lago de Remoray",
        reserve_remoray_desc: "Reserva protegida que abriga aves raras, libélulas e orquídeas. Vários trilhos suaves permitem explorar este local calmo e preservado.",
        
        rucher_title: "O Apiário dos Dois Lagos",
        rucher_desc: "Produção local de mel e produtos derivados. Possibilidade de conversar sobre apicultura e comprar mel verdadeiro do Haut-Doubs.",
        
        fromagerie_montdor_title: "Queijaria do Mont d’Or",
        fromagerie_montdor_desc: "Queijaria tradicional que produz o Mont d’Or DOP. Dependendo da hora, vista sobre as cubas ou o embalamento. Loja de queijos completa.",
        
        distillerie_pernot_title: "Destilaria Émile Pernot",
        distillerie_pernot_desc: "Destilaria histórica, conhecida pelo seu absinto. Visita guiada muito instrutiva, seguida de uma degustação de especialidades locais.",
        
        base_nautique_title: "Base náutica de Malbuisson",
        base_nautique_desc: "Espaço dedicado a atividades náuticas: paddle, gaivota, vela, caiaque. Aluguer de material na época. Atmosfera relaxante à beira do lago.",
        
        vtt_elec_title: "Aluguer de BTT elétrica",
        vtt_elec_desc: "Várias empresas de aluguer permitem explorar os trilhos do Mont-d’Or em BTT elétrica. Terreno variado tanto para desportistas como para principiantes.",
        
        peche_truite_title: "Pesca no Rio (Truta)",
        peche_truite_desc: "O Doubs oferece belos percursos para a truta no rio. Água límpida, setores calmos, ideal para pescadores principiantes ou experientes.",
        
        spa_rives_title: "Spa Les Rives Sauvages",
        spa_rives_desc: "Spa premium com piscina panorâmica, sauna, banho turco e tratamentos. Vista deslumbrante sobre o lago.",
        
        chiens_traineau_title: "Passeio de trenó puxado por cães",
        chiens_traineau_desc: "Atividade de inverno imperdível: batismo de trenó ou iniciação à condução. Experiência imersiva com os cães num percurso florestal típico.",

        et_plus_encore_title: "E mais ...",
        et_plus_encore_description: "Descubra ainda mais atividades e lugares para explorar visitando o site do posto de turismo de Malbuisson.",

        btn_website: "Site oficial",
        btn_maps: "Como chegar",
        info_min: "min",
        info_km: "km",

        // Footer
        footer_contact_title: "Contacte-nos",
        footer_links_title: "Links rápidos",
        footer_link_home: "Início",
        footer_link_rates: "Tarifas e Disponibilidade",
        footer_link_activities: "Atividades",
        footer_link_legal: "Aviso legal",
        footer_contact_form: "Formulário de contacto",
        footer_follow_title: "Reservar no Airbnb",
        footer_airbnb_text: "Veja as nossas avaliações e reserve com segurança.",
        footer_rights: "Todos os direitos reservados"
    }
};