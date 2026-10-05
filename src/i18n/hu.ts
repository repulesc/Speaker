import type { Messages } from './types';

/** Hungarian messages, informal register (tegezés). Native review pending (OPEN_QUESTIONS). */
export const hu: Messages = {
  app: {
    tagline: 'Találd meg a hangfalak és a hallgatási pont jó helyét, a teremakusztika alapján.',
    skipToContent: 'Ugrás a tartalomra',
    disclaimer: 'Iránymutatás, nem garancia. A végső szó a füledé.',
  },
  language: {
    label: 'Nyelv',
    en: 'English',
    hu: 'Magyar',
  },
  numbers: {
    label: 'Számok mutatása',
    off: 'Ki',
    on: 'Be',
  },
  theme: {
    label: 'Megjelenés',
    auto: 'Az eszközöd szerint',
    light: 'Világos',
    dark: 'Sötét',
  },
  units: {
    label: 'Mértékegység',
    metric: 'Metrikus (m, cm)',
    imperial: 'Angolszász (láb, hüvelyk)',
    error: {
      invalid: 'Ezt a hosszt nem értjük. Próbáld így: 3,5 m, 350 cm vagy 11′ 6″.',
      notPositive: 'A hossznak nullánál nagyobbnak kell lennie.',
      ambiguousFeetInches: 'A lábhoz és a hüvelykhez jel kell, például 11′ 6″ vagy 11 ft 6 in.',
    },
  },
  project: {
    untitled: 'Névtelen helyiség',
    copySuffix: 'másolat',
    switcher: 'Projektek',
    current: 'Aktuális projekt',
    new: 'Új projekt',
    duplicate: 'Másolat készítése',
    rename: 'Átnevezés',
    renameLabel: 'A projekt neve',
    delete: 'Törlés',
    deleteConfirm: 'Törlöd ezt: „{name}”? Ez nem vonható vissza.',
    saved: 'Elmentve ezen az eszközön',
    unsaved: 'Mentés…',
    unavailable:
      'Nincs mentés: a böngésződ letiltja a tárolást. Használd az exportálást, hogy ne vesszen el a munkád.',
    failed:
      'A mentés nem sikerült, lehet, hogy betelt a tárhely. Használd az exportálást, hogy ne vesszen el a munkád.',
  },
  menu: {
    image: 'Megosztás képként',
    label: 'Menü',
    support: 'A projekt támogatása ☕',
    undo: 'Visszavonás',
    redo: 'Újra',
    share: 'Megosztási link',
    export: 'Exportálás fájlba',
    import: 'Importálás fájlból',
    print: 'Nyomtatható lap',
    listen: 'Hallgatási jegyzetek',
    about: 'Névjegy és források',
  },
  share: {
    title: 'A beállítás megosztása',
    privacy:
      'A teljes beállítás magában a linkben van. Semmi nem megy ki szerverre, és a linket megnyitó mindenki saját másolatot kap.',
    includeNotes: 'A hallgatási jegyzeteim is kerüljenek bele',
    copy: 'Link másolása',
    copied: 'A link a vágólapon van',
    copyFailed: 'Nem sikerült automatikusan másolni. Jelöld ki a linket, és másold ki kézzel.',
    linkLabel: 'Megosztási link',
    close: 'Bezárás',
  },
  import: {
    success: 'Megnyitottuk a(z) „{name}” projektet új projektként.',
    error: {
      notJson: 'Ez nem olvasható projektfájl.',
      tooBig: 'Ez a fájl vagy link túl nagy ahhoz, hogy projekt legyen.',
      notAProject: 'Ebben a fájlban vagy linkben nincs projekt.',
      newerVersion: 'Ezt a projektet az alkalmazás újabb verziója készítette.',
      invalid: 'A projektet nem sikerült beolvasni: {detail}',
      tooMany: 'Túl sok mentett projekted van. Előbb törölj egyet.',
    },
    dismiss: 'Bezárás',
  },
  image: {
    subtitle: 'Szoba: {width} × {length}',
    needRoom: 'Add meg előbb a szoba méretét, utána lesz mit megosztani.',
    failed: 'Ebben a böngészőben nem sikerült elkészíteni a képet.',
  },
  notice: { undo: 'Visszavonás' },
  confidence: {
    label: 'Mennyire vagyunk biztosak?',
    step: {
      1: 'Durva tipp',
      2: 'Első benyomás',
      3: 'Megbízható',
      4: 'Részletes',
      5: 'Mérések nélkül ennél jobb nem lehet',
    },
    hintTitle: 'Mivel lenne pontosabb?',
    hint: 'Mondj többet erről: „{input}”, és biztosabbak leszünk.',
    nothingMore: 'Nincs mit hozzátenni: ennél biztosabb a megadott adatokból nem lehet.',
    capsTitle: 'A modell korlátai',
    cap: {
      nonRectangular: 'A helyiséged nem téglalap alakú, ezért csak nagyon durva képet tudunk adni.',
      outOfModel:
        'A helyiségedben olyan jellemzők vannak, amelyeket nem tudunk modellezni. A basszuseredményeket csak tájékoztatásnak vedd.',
      lightweightWalls:
        'A könnyűszerkezetes falakon kiszökik a basszus, ezért a basszusbecslés kevésbé megbízható.',
      lowConfidenceSurface:
        'Keveset tudunk azokról a felületekről, ahová az első visszaverődések érkeznek.',
    },
  },
  input: {
    room: {
      width: 'a helyiség szélessége',
      length: 'a helyiség hossza',
      height: 'a belmagasság',
      construction: 'a falak szerkezete',
    },
    speakers: {
      position: 'a hangfalak helye',
    },
    listener: {
      position: 'az ülőhely helye',
    },
    surfaces: 'a falfelületek',
    furnishing: 'a berendezés',
    speaker: {
      lowFrequencyMinus6dB: 'a hangfal mélyleadása',
      directivity: 'a hangfal sugárzási képe',
      portLocation: 'a basszusnyílás helye',
      enclosure: 'a hangfal háztípusa',
      acousticAxisHeight: 'a magassugárzó magassága',
      driverLayout: 'a hangszórók elrendezése',
    },
  },
  steps: { room: 'Helyiség' },
  field: {
    unusual: 'Biztos, hogy jó? A helyiségek általában {min} és {max} között vannak.',
    outOfRange: '{label}: {min} és {max} közötti értéket adj meg.',
    neededToStart: 'Az induláshoz kell',
    certainty: {
      label: 'Mennyire vagy biztos benne?',
      measured: 'Lemértem',
      estimated: 'Becslés',
      unknown: 'Nem tudom',
    },
  },
  room: {
    title: 'A szoba mérete',
    intro: 'Elég a durva érték is. Jelöld, mennyire vagy biztos benne, és később pontosíthatod.',
    width: 'Szélesség',
    length: 'Hossz',
    height: 'Belmagasság',
    widthHelp: 'Faltól falig, a helyiség keresztirányában.',
    lengthHelp: 'A hangfalak mögötti faltól a hátad mögötti falig.',
    heightHelp: 'Padlótól a mennyezetig.',
    construction: {
      legend: 'A falak főként…',
      solid: 'Tömör szerkezetűek (tégla, beton)',
      lightweight: 'Könnyűszerkezetesek (gipszkarton)',
      unknown: 'Nem tudom',
      help: 'A könnyűszerkezetes falakon átszökik a basszus, ezért a basszusbecslés kevésbé biztos.',
    },
    outOfModel: {
      legend: 'Van a helyiségben ezek közül valami?',
      help: 'Ezeket nem tudjuk modellezni, ezért kevésbé bízhatunk a basszuseredményekben.',
      'open-doorway': 'Nagy, nyitott ajtónyílás',
      'open-plan-connection': 'Nyílás egy másik helyiségbe',
      alcove: 'Beugró vagy fülke',
      'slanted-ceiling': 'Ferde mennyezet',
      'non-rectangular': 'Nem igazán téglalap alakú',
    },
    temperature: {
      summary: 'Haladó: a helyiség hőmérséklete',
      label: 'Hőmérséklet',
      help: 'A hang melegebb levegőben kicsit gyorsabban terjed. Ha üresen hagyod, 20 °C-ot feltételezünk.',
    },
  },
  boundary: {
    front: 'Elülső fal (a hangfalak mögött)',
    back: 'Hátsó fal (a hátad mögött)',
    left: 'Bal oldali fal',
    right: 'Jobb oldali fal',
    floor: 'Padló',
    ceiling: 'Mennyezet',
    short: {
      front: 'Elöl',
      back: 'Hátul',
      left: 'Bal',
      right: 'Jobb',
      floor: 'Padló',
      ceiling: 'Mennyezet',
    },
  },
  surface: {
    'plaster-concrete': 'Vakolat vagy beton',
    'plaster-brick': 'Vakolt tégla',
    'plaster-lath': 'Nádazott vagy lécezett vakolat (régi ház)',
    'gypsum-stud': 'Gipszkarton',
    glass: 'Üveg vagy ablak',
    'wood-floor': 'Fa padló',
    'carpet-heavy': 'Vastag szőnyeg',
    'carpet-underlay': 'Szőnyeg alátéttel',
    'curtain-heavy': 'Vastag függöny',
    'shelf-diffusive': 'Könyves- vagy CD-polc',
    'canvas-art': 'Festmény vagy vászon',
    custom: 'Egyedi',
    class: {
      reflective: 'visszaveri a hangot',
      absorptive: 'elnyeli a hangot',
      diffusive: 'szórja a hangot',
    },
  },
  surfaces: {
    title: 'Felületek',
    intro:
      'Az számít, miből vannak a falak, a padló és a mennyezet, mert ettől függ a helyiség hangzása. Elég a tipp is, és ez a lépés nem kötelező.',
    pick: 'Melyik felület?',
    base: 'Miből van: {name}?',
    dontKnow: 'Nem tudom',
    dontKnowHelp: 'Ezt feltételezzük: {material}.',
    dontKnowShort: 'Nem tudom ({material})',
    row: { walls: 'Falak', floor: 'Padló', ceiling: 'Mennyezet' },
    mixed: 'Falanként eltérő',
    eachWall: 'Falanként külön',
    addThings: 'Valami a falon',
    addThingsHint: 'Ablak, polc, függöny, kép',
    needRoom: 'Add meg előbb a helyiség méretét, utána leírhatod a felületeket.',
    elevation: 'Nézet a helyiség belsejéből: {name}',
    patchLabel: '{name}, {left} távolságra, {top} magasan. {hint}',
    reflectionHint:
      'A karikák mutatják, hová érkezik az első visszaverődés az egyes hangfalaktól. Ezek a helyek számítanak a legjobban: mi van ott?',
    patches: {
      title: 'Mi van itt: {name}?',
      intro:
        'Ablak, polc, függöny, festmény: bármi, ami a felület egy részét eltakarja. Húzd a helyére, vagy írd be a pontos értékeket.',
      empty: 'Még nincs hozzáadva semmi.',
      kind: {
        window: 'Ablak',
        shelf: 'Polc vagy CD-fal',
        curtain: 'Függöny',
        painting: 'Festmény',
        rug: 'Szőnyeg',
        other: 'Egyéb',
      },
      material: 'Anyag',
      label: 'Név (nem kötelező)',
      u: { fromFront: 'Távolság az elülső faltól', fromLeft: 'Távolság a bal faltól' },
      v: { height: 'Magasság a padlótól', fromFront: 'Távolság az elülső faltól' },
      width: 'Szélesség',
      height: 'Magasság',
      depth: 'Mélység',
      remove: 'Eltávolítás',
    },
  },
  furnishing: {
    title: 'Bútorok',
    intro:
      'A bútorok változtatják, mennyire „élő” a helyiség hangja, és a hangfalak közelében lévő tárgyak elmoshatják a hangot. Ez a lépés nem kötelező.',
    needRoom: 'Add meg előbb a helyiség méretét.',
    busy: {
      legend: 'Mennyire teli van a helyiség?',
      help: 'Elég egy gyors becslés. Vagy helyezd el lent a bútorokat a pontosabb eredményért.',
      combined:
        'A lent elhelyezett bútorok is számítanak: a kettő közül azt vesszük, amelyik több hangot nyel el.',
      bare: 'Üres',
      some: 'Kevés bútor',
      busy: 'Zsúfolt',
      veryBusy: 'Nagyon zsúfolt',
    },
    objects: {
      title: 'Bútorok és egyéb tárgyak',
      intro:
        'Add hozzá, ami a helyiségben van, aztán húzd a helyére a rajzon, vagy írd be a pontos értékeket.',
      empty: 'Még nincs elhelyezve semmi.',
    },
    affects: 'Ezt befolyásolja',
    tag: {
      room: 'a helyiség hangzása',
      reflections: 'visszaverődések',
      view: 'eltakarhatja a rálátást',
    },
    name: 'Név (nem kötelező)',
    fromLeft: 'A bal faltól',
    fromFront: 'Az elülső faltól',
    width: 'Szélesség',
    depth: 'Mélység',
    height: 'Magasság',
    material: {
      label: 'Anyag',
      hard: 'Kemény (visszaveri a hangot)',
      soft: 'Puha (kárpit, könyvek, textil)',
      absorbent: 'Hangelnyelő (vastag, porózus anyag)',
    },
    rotate: 'Elforgatás 90°-kal',
    remove: 'Eltávolítás',
  },
  speakers: {
    ask: {
      notSure: 'Nem tudom',
      note: 'Ezek tipikus értékeket töltenek ki, becslésként jelölve. Megvan a leírás? A pontos számokat a További részletek alatt írhatod be.',
      kind: {
        label: 'Milyen hangfalak?',
        bookshelf: 'Polc- vagy állványos hangfal',
        floorstander: 'Álló hangfal (torony)',
        monitor: 'Stúdiómonitor',
        desktop: 'Kis asztali hangfal',
        wall: 'Falra szerelt vagy falba épített',
      },
      size: {
        label: 'Mekkora?',
        small: 'Kicsi',
        medium: 'Közepes',
        large: 'Nagy',
        tall: '{size}, kb. {height} magas',
      },
      drivers: {
        label: 'Hangszórók',
        'two-way': 'Kétutas (magas- és mélysugárzó)',
        'three-way': 'Háromutas',
        coaxial: 'Koaxiális (a magassugárzó a mélysugárzó közepén)',
      },
      port: {
        label: 'Basszusreflex nyílás',
        sealed: 'Nincs (zárt doboz)',
        front: 'Elöl',
        rear: 'Hátul',
        down: 'Alul',
        side: 'Oldalt',
      },
      madeFor: {
        label: 'Mire készült?',
        hifi: 'Otthoni zenehallgatásra (hi-fi)',
        studio: 'Stúdiómunkára (monitor)',
        studioHint: 'A monitorokat közeli hallgatásra tervezik. Ha asztalnál ülsz, jelezd:',
        studioDesk: 'Asztalnál hallgatok',
      },
      spread: {
        label: 'Milyen szélesen sugároznak',
        help: 'Csak a hallgatási távolságról szóló tanácsot változtatja meg, a térképet soha.',
        narrow: 'Keskeny',
        typical: 'Szokásos',
        wide: 'Széles',
      },
      placedOn: {
        label: 'Min állnak?',
        floor: 'A padlón',
        stand: 'Állványon vagy polcon',
        desk: 'Asztalon',
      },
    },
    title: 'Hangfalak',
    intro: 'Válaszolj arra, amit tudsz, és add meg, hol állnak. Semmi sem kötelező.',
    describe: { title: 'A te hangfalad' },
    more: {
      summary: 'További részletek',
      hint: 'Pontos méretek, ülőhely, befordítás, hangfalfájl',
    },
    brand: 'Márka (saját emlékeztetőnek)',
    model: 'Típus (saját emlékeztetőnek)',
    size: { width: 'Szélesség', height: 'Magasság', depth: 'Mélység' },
    enclosure: {
      label: 'Milyen a doboz?',
      sealed: 'Zárt',
      ported: 'Nyílásos (basszusreflex)',
      'passive-radiator': 'Passzív membrán',
      'open-baffle': 'Nyitott baffle',
      unknown: 'Nem tudom',
    },
    controls: {
      legend: 'Van rajta…',
      treble: 'Magashang-szabályzó',
      bass: 'Mélyhang-szabályzó',
      wall: 'Fal- vagy elhelyezés-beállítás (távolság a faltól)',
      minWall: 'A gyártó által megadott legkisebb faltávolság',
      minWallValue: 'Legkisebb távolság a faltól',
    },
    advanced: {
      f6: 'A legmélyebb hang, amit jól játszik (Hz)',
      f6Help:
        'Az a frekvencia, ahol a basszus 6 dB-lel esik, a műszaki adatokból. Hagyd üresen, ha nem tudod.',
    },
    file: {
      save: 'Hangfal mentése fájlba',
      load: 'Hangfal betöltése fájlból',
      loaded: 'A hangfal betöltve a fájlból.',
      error: {
        notJson: 'Ez nem olvasható hangfalfájl.',
        tooBig: 'Ez a fájl túl nagy ahhoz, hogy hangfalfájl legyen.',
        notAProfile: 'Ebben a fájlban nincs hangfal.',
        newerVersion: 'Ezt a hangfalfájlt az alkalmazás újabb verziója készítette.',
        invalid: 'A hangfalfájlt nem sikerült beolvasni: {detail}',
      },
    },
    placement: {
      title: 'Hol állnak?',
      help: 'A rajzon is húzhatod őket.',
      seatTitle: 'Az ülőhelyed és az irány',
      certainty: 'Mennyire vagy biztos ezekben a helyekben?',
      clearance: 'A hangfalak hátulja az elülső faltól',
      spacing: 'A hangfalak távolsága egymástól',
      stand: 'A hangfal alapjának magassága (állvány vagy asztal)',
      seat: 'Az ülőhely az elülső faltól',
      ears: 'A füled magassága ülve',
      toeIn: 'Befordítás (fok)',
      toeInHelp:
        'A hangfalak befordítása feléd. A 0 azt jelenti, hogy egyenesen előre néznek. Sok hangfal mindkét módon jól szól: próbáld ki mindkettőt.',
      mirror: 'A hangfalak maradjanak szimmetrikusak (az egyik mozgatása a másikat is mozgatja)',
    },
    limits: {
      title: 'Mi mozdítható?',
      help: 'A valódi helyiségeknek korlátai vannak. Mondd meg, mi áll fix helyen, és csak olyat javaslunk, amit meg is tudsz tenni.',
      reach: 'Milyen messze jöhetnek előre a hangfalak a faltól?',
      reachValue: 'Távolság az elülső faltól',
      seat: {
        legend: 'Mozdítható az ülőhelyed?',
        free: 'Szabadon',
        range: 'Előre-hátra, korlátok között',
        fixed: 'Nem, fix helyen van',
        from: 'Legközelebb az elülső falhoz',
        to: 'Legtávolabb az elülső faltól',
      },
      fixed: 'A hangfalaim nem mozdíthatók (csak jobb ülőhelyet javasolj)',
      zone: {
        legend: 'Milyen messzire mozdíthatod a hangfalakat a mostani helyükről?',
        help: 'A javaslatok minden hangfalat ennyin belül tartanak.',
        any: 'Bárhová',
      },
    },
  },
  goals: {
    title: 'Mit szeretnél a hangtól?',
    intro:
      'Mondd el, mi fontos neked. A célok egy kicsit módosítják a tanácsot; a helyiség fizikája mindig előbbre való.',
    goal: {
      'wide-stage': { name: 'Széles hangszínpad', help: 'A zene a hangfalakon túlra is kiterjed.' },
      'precise-imaging': {
        name: 'Pontos leképezés',
        help: 'A hangszerek élesen körülhatárolt helyeken maradnak.',
      },
      'flat-response': {
        name: 'Egyenes, semleges hang',
        help: 'Semmi nem dübörög, nem csillog és nem üreges.',
      },
      'deep-bass': {
        name: 'Mély basszus',
        help: 'A legmélyebb hangokig lemenni, akár kicsit egyenetlenebb basszus árán is.',
      },
      'low-volume-listening': {
        name: 'Többnyire halkan hallgatok',
        help: 'Halkan a fülünk kevesebb basszust és magasat hall.',
      },
    },
    level: { dontCare: 'Nem számít', nice: 'Jó lenne', important: 'Fontos' },
    conflict:
      'A széles és a pontos más irányba húz. Keresünk egy egyensúlyt, és megmutatjuk, mit kell érte feláldozni.',
  },
  results: {
    calculating: 'Számolás…',
    needRoom: 'Add meg a helyiség méretét, és máris kapsz egy első választ.',
    yourSetup: 'A jelenlegi elrendezésed',
    bestFound: 'A legjobb, amit találtunk',
    counts: 'Piros zászló: {red} · Figyelem: {caution}',
    score: { poor: 'Gyenge', fair: 'Közepes', good: 'Jó', veryGood: 'Nagyon jó' },
  },
  plan: {
    label: 'A helyiség felülnézetben',
    placeholder: 'Add meg a helyiség méretét, és itt megjelenik.',
    frontWall: 'Elülső fal (hangfalak)',
    seat: 'Ülőhely',
    speaker: 'Hangfal',
    summary:
      'A helyiség {width} széles és {length} hosszú. A hangfalak {spacing} távolságra vannak egymástól. Az ülőhely {distance} távolságra van a hangfalaktól.',
    speakerLeft: 'Bal hangfal',
    speakerRight: 'Jobb hangfal',
    speakers: 'Hangfalak',
    sideLabel: 'A helyiség oldalnézetben',
    view: { label: 'Nézet', top: 'Felülnézet', side: 'Oldalnézet' },
    item: {
      hint: 'A nyílbillentyűk 1 cm-t, a Shift és a nyílbillentyűk 10 cm-t mozgatnak.',
      hintSide:
        'A bal és jobb nyíl az elülső faltól mért távolságot, a fel és le nyíl a magasságot változtatja. A Shift nagyobb lépést ad.',
      speaker: '{name}. {front} az elülső faltól, {side} a legközelebbi oldalfaltól. {hint}',
      speakerSide: '{name}. {front} az elülső faltól, {height} a padló felett. {hint}',
      seat: 'Ülőhely. {front} az elülső faltól, a füled {height} magasan van a padló felett. {hint}',
      seatSide:
        'Ülőhely. {front} az elülső faltól, a füled {height} magasan van a padló felett. {hint}',
      object: '{name}. {hint}',
    },
  },
  variant: {
    tabs: 'Változatok',
    current: 'Jelenlegi',
    new: 'Új változat',
    rename: 'Változat átnevezése',
    renameLabel: 'A változat neve',
    delete: 'Változat törlése',
    deleteConfirm: 'Törlöd ezt a változatot: „{name}”? Ez nem vonható vissza.',
  },
  object: {
    bed: 'Ágy',
    sofa: 'Kanapé',
    armchair: 'Fotel',
    table: 'Asztal',
    cabinet: 'Szekrény',
    shelf: 'Polc',
    radiator: 'Radiátor',
    'other-speaker': 'Másik hangfal',
    tv: 'TV',
    desk: 'Íróasztal',
    wardrobe: 'Gardrób',
    bookcase: 'Könyvespolc',
    piano: 'Zongora',
    rack: 'Hi-fi állvány',
    plant: 'Nagy növény',
    fireplace: 'Kandalló',
    lamp: 'Állólámpa',
    subwoofer: 'Mélynyomó',
    custom: 'Egyéb tárgy',
  },
  dock: {
    label: 'Szakaszok',
    room: 'Helyiség',
    surfaces: 'Felületek',
    furnishing: 'Bútorok',
    speakers: 'Hangfalak',
    goals: 'Céljaid',
    side: 'Oldalnézet',
  },
  settings: {
    label: 'Beállítások',
  },
  nav: {
    room: 'A szobád',
    results: 'Eredmények',
    why: 'Miért ez az eredmény',
    treat: 'A szoba javítása',
    listen: 'Hallgatási jegyzetek',
    bass: 'Basszus az ülőhelyeden',
    placement: 'Mit keressünk',
    back: 'Vissza',
    notSet: 'Nincs megadva',
    progress: '{n} / {total} kész',
    status: { done: 'megadva', partial: 'részben megadva', todo: 'még nincs megadva' },
    none: 'Nincs',
  },
  survey: {
    start: 'Kezdjük',
    welcome: {
      title: 'Hová kerüljenek a hangfalaid?',
      body: 'Válaszolj néhány gyors kérdésre a szobádról, és megmutatjuk, hová tedd a hangfalaidat és hová ülj, mielőtt bármi mást kérnénk.',
      free: 'Ingyenes, regisztráció és e-mail-cím nélkül.',
      private: 'A szobád adatai ezen az eszközön maradnak.',
      short: 'Négy rövid kérdés, nagyjából egy perc.',
    },
    step: '{n} / {total}',
    skip: 'Kihagyom',
    back: 'Vissza',
    next: 'Tovább',
    done: 'Mutasd',
    room: {
      title: 'Mekkora a szobád?',
      help: 'Elég a durva érték. Ha a belmagasságot üresen hagyod, szokásos {height}-rel számolunk.',
    },
    goal: {
      title: 'Mire vagy kíváncsi?',
      help: 'Ezt bármikor megváltoztathatod.',
      speakers: { name: 'Hová tegyem a hangfalaimat', help: 'Az ülőhelyem marad, ahol van.' },
      seat: { name: 'Hová üljek', help: 'A hangfalaim maradnak, ahol vannak.' },
      both: { name: 'Mindkettő', help: 'A hangfalakat és az ülőhelyet is mozdíthatom.' },
    },
    speaker: {
      title: 'Mesélj a hangfalaidról',
      help: 'Arra válaszolj, amit tudsz. A „Nem tudom” is jó válasz.',
    },
    where: {
      title: 'Hol vannak most a dolgok?',
      help: 'Elég a durva érték. Később mindent húzhatsz a rajzon.',
      both: 'Nincs mit lemérni: mindkettőnek a legjobb helyet keressük.',
    },
  },
  suggest: {
    title: 'A legjobb elhelyezés',
    move: {
      label: 'Mit helyezzünk el',
      both: 'Mindkettőt',
      speakers: 'Hangfalakat',
      seat: 'Ülőhelyet',
    },
    ready: {
      label: 'Készen állok az akusztikai kezelésre befektetni',
      help: 'A panelek és basszuscsapdák is megjelennek. Kikapcsolva: csak az, amit ma ki tudsz próbálni.',
    },
    place: {
      label: 'Honnan hallgatod',
      chair: 'Fotel',
      sofa: 'Kanapé',
      desk: 'Asztal',
      bed: 'Ágy',
    },
    speakers: 'Hangfalak',
    bass: 'Basszus azon a helyen',
    bassPlain: {
      even: 'Egyenletes',
      fair: 'Nagyjából egyenletes',
      uneven: 'Egyenetlen',
    },
    bassWord: {
      even: 'Egyenletes',
      fair: 'Nagyjából egyenletes, {frequency} körül a leggyengébb',
      uneven: 'Egyenetlen {frequency} körül',
    },
    optionsTitle: 'Beállítások',
    speakersLine: '{front} az elülső faltól (a hátlaptól), egymástól {spacing}',
    seat: 'Az ülőhelyed',
    seatLine: '{front} az elülső faltól, {distance} mindkét hangfaltól',
    stay: 'Maradnak a helyükön',
    seatStays: 'Marad a helyén',
    mood: 'A mostani beállításod: {word}',
    say: {
      speakers: 'Tedd a hangfalakat {parts}.',
      away: '{d}-rel messzebb az elülső faltól',
      toward: '{d}-rel közelebb az elülső falhoz',
      apart: '{d}-rel távolabb egymástól',
      together: '{d}-rel közelebb egymáshoz',
      and: ' és ',
      seatBack: 'Ülj {d}-rel hátrébb.',
      seatForward: 'Ülj {d}-rel előrébb.',
      keep: 'Hagyj mindent a helyén.',
    },
    verdict: 'A mostani elrendezésed: {now}. Ezzel az elhelyezéssel: {best}.',
    apply: 'Alkalmaz',
    applied: 'Az elhelyezés kész.',
    already: 'Az elrendezésed már nagyjából a legjobb, ami ebben a szobában elérhető.',
    others: 'Más jó lehetőségek',
    option: '{letter} lehetőség: {score}',
    closer:
      'A szoba túl kicsi ahhoz, hogy 1,5 m-re ülj a hangfalaktól, ezért ez a legjobb közelebbi hely.',
    nothing: 'Egyetlen elhelyezés sem fér bele a korlátaidba. Engedj több mindent mozdulni.',
    zoneCost: 'Ha legfeljebb {zone}-t mozdulnak: {inside}. Több hellyel: {outside}.',
  },
  found: {
    label: 'Amit találtunk',
    dead: 'Nyugodt szoba, sok puha, hangelnyelő dologgal.',
    balanced: 'Kiegyensúlyozott szoba: se nem túl visszhangos, se nem túl tompa.',
    live: 'Élénk szoba: a hang sokat verődik benne.',
    note: 'A legmélyebb rezonanciája egy {pitch} {letter} hang közelében van.',
    veryLow: 'nagyon mély',
    low: 'mély',
    numbers: 'Utózengés {t60} s; a legmélyebb rezonancia {note}, {f}.',
    letters: 'C,Cisz,D,Disz,E,F,Fisz,G,Gisz,A,B,H',
  },
  live: {
    title: 'Élj vele egy kicsit',
    intro:
      'Adj neki néhány estét. Egy gyors meghallgatás félrevezethet; pár nap után többet hallasz. Utána jelöld, milyen.',
    position: 'Ez a hely',
    before: 'Az előző',
    speakers: 'A hangfalaid összességében',
    face: { 1: 'Nem igazán', 3: 'Rendben van', 5: 'Imádom' },
    compare: {
      agree: 'Ezt jobban szereted, és az alkalmazás is.',
      disagree:
        'Az előzőt jobban szeretted. Az alkalmazás ezt értékeli többre, de a füled dönt: adj neki még néhány estét, aztán bízz abban, amit hallasz.',
      same: 'Mindkettőt nagyjából egyformán szereted. A te szobádban a különbség egyszerűen kicsi lehet.',
    },
    local: 'Csak ezen az eszközön marad.',
    hide: 'Elrejtés',
  },
  result: {
    title: 'Az eredményed',
    brief: {
      fixed: '{now}, így ahogy van.',
      top: '{now}. Áthelyezéssel itt nem lehetne érdemben javítani.',
      better: 'Most: {now}. Az alábbi elhelyezéssel: {best}.',
      same: 'Most: {now}. Az alábbi elhelyezés még finomít rajta.',
    },
    idea: 'Ezt is érdemes kipróbálni',
    moreTips: 'További tippek',
    scores: 'Pontszám most {now}, a legjobb helyen {best}, 1,00-ből.',
    area: {
      even: {
        sofa: 'A kanapén mindenkinek nagyjából ugyanilyen.',
        desk: 'Az asztalnál mozogva is nagyjából ugyanilyen.',
        bed: 'Az ágy egészén nagyjából ugyanilyen.',
      },
      uneven: 'Középen: {centre}. {where}: {worst}.',
      where: {
        left: 'A bal szélén',
        right: 'A jobb szélén',
        front: 'Elöl',
        back: 'Hátul',
        ends: 'A két szélén',
      },
    },
  },
  panel: {
    label: 'Beállítások és eredmények',
    close: 'Vissza az eredményekhez',
    done: 'Kész',
  },
  map: {
    dimmed: 'Nem ajánlott',
    bestHere: 'A legjobb itt: {word}',
    withScore: '{word} · {score}',
    absolute: 'Abszolút skála',
    hidePanel: 'Oldalsáv elrejtése',
    best: 'Legjobb',
    now: 'Most: {word}',
    before: 'Előtte',
    showPanel: 'Oldalsáv megjelenítése',
    notListening: 'Nem hallgatási hely',
    notStereo: 'Nem sztereó hely',
    notSeat: 'Itt nem lehet ülni',
    label: 'Térkép',
    hint: 'Húzz bármit. A térkép mozgatás közben újrarajzolódik. Kattints egy számra, és pontos értéket írhatsz be.',
    layerLabel: 'Térképréteg',
    showing: 'Látható',
    backToMain: 'Vissza a fő térképhez',
    pick: { speakers: 'Hangfalak', seat: 'Ülőhely' },
    why: 'Miért?',
    whyLabel: 'Mitől jó vagy gyenge egy hely',
    poorer: 'Gyengébb',
    better: 'Jobb',
    flagged: 'Satírozva: az irányelvek szerint ide nem érdemes leülni.',
    caption: 'Hová kerülhet az ülőhelyed ({where}).',
    whereNow: 'a hangfalak most is itt vannak',
    wherePreview: 'hangfalak: Hely {letter}',
    pin: 'Legjobb hely: {letter}. Pontszám: {score}.',
    dimEdit: 'Pontos érték megadása: {name}',
    dim: {
      clearance: 'Hangfal hátulja és az elülső fal',
      spacing: 'A két hangfal távolsága',
      side: 'Hangfal és az oldalfal',
      seat: 'Ülőhely és az elülső fal',
      width: 'A helyiség szélessége',
      length: 'A helyiség hossza',
    },
  },
  layer: {
    speakers: {
      name: 'Hová kerüljenek a hangfalak',
      what: 'Hol szólnának a legjobban a hangfalak, ha az ülőhelyed ott marad, ahol van. Minden pont azt mutatja, hová állna a hangfalpár, tükrözve az ülőhelyed körül. Minél erősebb a szín, annál jobb.',
    },
    overall: {
      name: 'Összesített',
      what: 'Mennyire jó itt az ülőhely, mindent egyformán számítva. Minél erősebb a szín, annál jobb.',
    },
    goals: {
      name: 'A céljaid',
      what: 'Mennyire jó itt az ülőhely, a hangfalakkal ott, ahol most vannak. Minél erősebb a szín, annál jobb.',
    },
    bass: {
      name: 'Basszus egyenletessége',
      what: 'Mennyire egyenletes a basszus ezen az ülőhelyen. A halvány dörmögő vagy vékony basszust jelent.',
    },
    nulls: {
      name: 'Basszuslyukak',
      what: 'Eltűnik-e itt egy basszushang. A halvány mély lyukat jelent.',
    },
    frontWall: {
      name: 'Falról jövő interferencia',
      what: 'A hangfalak mögötti fal okozta mélypont, ahogy itt hallod.',
    },
    stereo: {
      name: 'Sztereó',
      what: 'Mennyire jó a szög és a távolság a két hangfalhoz.',
    },
    symmetry: {
      name: 'Szimmetria',
      what: 'A helyiség két oldala egyformán kezeli-e a hangot.',
    },
    backWall: {
      name: 'Hátsó fal',
      what: 'A halvány azt jelenti, hogy túl közel vagy a hátsó falhoz.',
    },
  },
  evidence: {
    physics: 'Fizika',
    guideline: 'Irányelv',
    heuristic: 'Ökölszabály',
    subjective: 'Füllel',
  },
  severity: {
    'red-flag': 'Piros zászló',
    caution: 'Figyelem',
    info: 'Megjegyzés',
    ok: 'Rendben',
  },
  concern: {
    bass: 'Basszus',
    frontWall: 'A hangfalak mögötti fal',
    reflections: 'Visszaverődések',
    stereo: 'Sztereó kép',
    room: 'A helyiség',
    speaker: 'A hangfalad',
    objects: 'Útban lévő tárgyak',
    rulesOfThumb: 'Ökölszabályok',
  },
  why: {
    title: 'Miért',
    setup: 'A jelenlegi elrendezés',
    best: 'A legjobb, amit találtunk',
    tryIt: 'Hely {letter} kipróbálása',
    applied: 'Hely {letter} beállítva. A visszavonás visszaadja az eredetit.',
    spotDetails:
      'Hangfalak {front} távolságra az elülső faltól, egymástól {spacing}. Ülőhely {seat} az elülső faltól.',
    preview: 'Hely {letter} látszik a térképen és a diagramon.',
    stopPreview: 'Vissza a jelenlegi elrendezéshez',
    spotsTitle: 'Legjobb helyek',
    compromise:
      'A megadott korlátokon belül nincs olyan hely, ami minden komoly problémát elkerül, ezért ezek a legkevésbé rosszak. A komoly gondjaik lent láthatók; ha lazítasz egy korláton (mi mozdulhat), az segíthet.',
    allFixed:
      'Az ülőhelyet és a hangfalakat is rögzítettnek jelölted, így nincs mit mozgatni. A lenti megállapítások és a Javítás fül így is érvényesek.',
    spotLabel: 'Hely {letter}',
    moveFirst: 'A legjobb helyre költözés segítene a legtöbbet.',
    alreadyGood: 'Az elrendezésed már közel van a legjobbhoz, amit találtunk.',
    fragile: {
      steady: 'Jól tartja magát, ha pár centit tévedsz.',
      sensitive:
        'Érzékeny: a kis elhelyezési vagy méretbeli hibák kicsit változtatnak az eredményen.',
      fragile: 'Törékeny: ez csak akkor működik, ha minden pontosan úgy van, ahogy megadtad.',
    },
    fragileShort: { steady: 'stabil', sensitive: 'érzékeny', fragile: 'törékeny' },
    problems: 'Amire érdemes ránézni',
    noProblems: 'Ezzel az elrendezéssel nincs aggasztó.',
    notes: 'Megjegyzések',
    showNotes: 'Megjegyzések mutatása ({count})',
    hideNotes: 'Megjegyzések elrejtése',
    folk: 'Ökölszabályok',
    confidence: 'Mennyire biztosak vagyunk?',
    confidenceHint:
      'Minél többet árulsz el a helyiségről, annál jobb a tanács. Következő legjobb lépés: {next}.',
    disclaimer: 'Útmutatás, nem garancia. A füled dönt.',
  },
  next: {
    surfaces: 'válaszd ki a falak anyagát',
    furnishing: 'add meg, mennyire teli a helyiség',
    room: {
      width: 'mérd meg a helyiség szélességét',
      length: 'mérd meg a helyiség hosszát',
      height: 'mérd meg a belmagasságot',
      construction: 'add meg, miből vannak a falak',
    },
    speakers: {
      position: 'mérd meg, hol vannak a hangfalak',
    },
    listener: {
      position: 'mérd meg, hol ülsz',
    },
    speaker: {
      lowFrequencyMinus6dB: 'add meg a hangfal legmélyebb hangját',
      directivity: 'add meg a hangfal sugárzási szögét',
      portLocation: 'add meg, hol van a hangfal basszusnyílása',
      enclosure: 'add meg a hangfal doboztípusát',
      acousticAxisHeight: 'mérd meg a magassugárzó magasságát',
      driverLayout: 'add meg a hangfal hangszóróinak elrendezését',
    },
  },
  folkRule: {
    H01: 'A népszerű 38%-os szabály',
    H02: 'A harmadok szabálya',
    asGood:
      '{rule} szerint az ülőhelyed {seatY} lenne. A térkép egyetért: ez a hely majdnem olyan jó, mint a legjobb ebben a sorban.',
    close:
      '{rule} szerint az ülőhelyed {seatY} lenne. A térkép szerint ez közel van, de a(z) {bestY} egy kicsit jobb.',
    worse:
      '{rule} szerint az ülőhelyed {seatY} lenne. Ebben a helyiségben a térkép szerint a(z) {bestY} egyértelműen jobb.',
    notAllowed:
      '{rule} szerint az ülőhelyed {seatY} lenne, de oda nem kerülhet ülőhely (túl közel van egy hangfalhoz, vagy valami útban van).',
    flag: ' Az irányelvek szerint pont ide nem érdemes ülni.',
  },
  probe: {
    title: 'Ülőhely itt · {front} az elülső faltól',
    moveHere: 'Ülőhelyem ide',
    speakersTitle: 'Hangfalak itt',
    speakersHere: 'Hangfalak itt: {word}',
    speakersNot:
      'Nem sztereó hely: itt a hangfalak túl közel lennének hozzád, melletted vagy mögötted, vagy nem férnének el.',
    speakersFlagged: 'Nem ajánlott: itt bútor van útban.',
    moveSpeakers: 'Hangfalak ide',
    close: 'Bezárás',
    notAllowed: 'Ide nem kerülhet ülőhely: túl közel van egy hangfalhoz, vagy valami útban van.',
    flagged: 'Az irányelvek szerint ide nem érdemes leülni.',
    allFine: 'Itt semmi nem kiugró.',
    weakest: 'Leggyengébb pont: {layer}.',
    score: 'Pontszám: {word}',
  },
  chart: {
    title: 'Basszus az ülőhelyeden',
    sub: 'a várható alak, nem a hangerő',
    now: 'Az ülőhelyed',
    spot: 'Hely {letter}',
    modes: 'A helyiség rezonanciái',
    band: 'Értékelt tartomány',
    desc: 'Várható basszus {from} és {to} között: legerősebb {peak} körül, leggyengébb {dip} körül.',
    noData: 'Add meg a helyiség méretét, és látni fogod a várható basszust.',
  },
  words: {
    gain: {
      high: 'nagy',
      'very-high': 'nagyon nagy',
    },
    zone: {
      near: 'Ez a falhoz közelinek számít.',
      away: 'Ez a faltól távolinak számít.',
    },
    speaker: {
      both: 'Mindkét hangfal',
      left: 'Bal hangfal',
      right: 'Jobb hangfal',
    },
    speakerFrom: { left: 'a bal hangfaltól', right: 'a jobb hangfaltól' },
    closer: {
      left: 'a bal',
      right: 'a jobb',
    },
    wall: {
      left: 'bal fal',
      right: 'jobb fal',
      front: 'elülső fal',
      back: 'hátsó fal',
      floor: 'padló',
      ceiling: 'mennyezet',
    },
    boundary: {
      front: 'elülső fal',
      side: 'oldalfal',
      floor: 'padló',
      ceiling: 'mennyezet',
    },
    direction: {
      above: 'felett',
      below: 'alatt',
    },
    source: {
      manufacturer: 'a gyártó előírása',
      default: 'egy tipikus minimum',
    },
  },
  finding: {
    P02: {
      lowestModes:
        'A helyiség legmélyebb basszushangjai kb. {length} (hosszirányban), {width} (szélességben) és {height} (magasságban).',
    },
    P04: {
      frontWall:
        '{speaker}: a mélysugárzó {distance} távolságra van az elülső faltól, ezért némi basszus kioltódik {frequency} körül.',
      aligned:
        '{speaker}: a mélysugárzó nagyjából egyforma távolságra van két felülettől ({boundaryA}, {boundaryB}), ezért a basszusmélypontjaik egybeesnek {frequency} körül.',
    },
    P05: {
      low: 'A közeli falak alig adnak plusz basszust a hangfalaknak.',
      moderate: 'A közeli falak némi plusz basszust adnak a hangfalaknak (kb. {belowHz} alatt).',
      high: 'A közeli falak sok plusz basszust adnak (kb. {belowHz} alatt). Nehéznek hallatszhat.',
      'very-high':
        'A hangfalak sarokban vagy sarok mellett vannak: a basszus erősen és egyenetlenül megemelkedik kb. {belowHz} alatt.',
    },
    P06: {
      sideWall:
        '{speaker}: az első visszaverődés ({boundary}) {delayMs} késéssel ér hozzád a közvetlen hang után. Az a felület ({surface}) {surfaceClass}.',
      floor:
        '{speaker}: a padlóról visszaverődő hang {delayMs} késéssel ér hozzád a közvetlen hang után. A padló ({surface}) {surfaceClass}.',
      ceiling:
        '{speaker}: a mennyezetről visszaverődő hang {delayMs} késéssel ér hozzád a közvetlen hang után. A mennyezet ({surface}) {surfaceClass}.',
      scattering:
        '{speaker}: a visszaverődés pontja ({boundary}) olyan felületen van, amely szórja a hangot ({surface}), ezért ott egyszerű visszaverődést nem jósolunk.',
    },
    P07: {
      transition:
        'Kb. {frequency} alatt a helyiség rezonanciái uralkodnak, felette a hang egyenletesebben keveredik (valahol {low} és {high} között).',
    },
    P08: {
      dead: 'A helyiség a tompa oldalon van: az utózengés kb. {t60} ({low} és {high} között). A hang közeli és száraz.',
      balanced:
        'A helyiség a szokásos tartományban van: az utózengés kb. {t60} ({low} és {high} között).',
      live: 'A helyiség a visszhangos oldalon van: az utózengés kb. {t60} ({low} és {high} között). Puha bútorok vagy függönyök megnyugtatnák.',
    },
    P09: {
      peak: 'Ezen az ülőhelyen a basszus {frequency} körül dörmögni fog, kb. {db}-lel hangosabban a többinél.',
      dip: 'Ezen az ülőhelyen a basszus {frequency} körül szinte eltűnik, kb. {db}-lel halkabb a többinél.',
      smooth:
        'A várható basszus egyenletes ezen az ülőhelyen: nincs 6 dB-nél nagyobb csúcs vagy mélypont.',
      notScored:
        'Ez a hangfal csak kb. {lowFrequencyMinus6dB} fölött szól, ami túl magas ahhoz, hogy a helyiség basszusrezonanciáit megítéljük, ezért nem is tesszük.',
    },
    P10: {
      ratio:
        'A közvetlen és a szobahang a hangfaltól {criticalDistance} távolságra egyforma. Te {listeningDistance} távolságra ülsz, ennek {ratio}-szeresére.',
    },
    P11: {
      coincident:
        'A helyiség néhány legmélyebb basszusrezonanciája közel esik egymáshoz (például {frequencyA} és {frequencyB}), ezért ezek a hangok dörmöghetnek.',
      bonello:
        'A helyiség rezonanciái kb. {band} fölött ritkulnak, ezért a basszus ott egyenetlen lehet.',
      ituPass: 'A helyiség arányai megfelelnek az ITU-R hallgatószobákra vonatkozó ajánlásának.',
      ituFail:
        'A helyiség arányai kívül esnek az ITU-R hallgatószoba-ajánlásán. Ezen nem tudsz változtatni, csak megmagyarázza, miért nehezebb néhány helyiség.',
    },
    G01: {
      redFlag:
        'Az ülőhely majdnem pontosan a helyiség hosszának felénél van, ahol a legmélyebb basszushang szinte eltűnik. Told előre vagy hátra a helyiség hosszának nagyjából tizedével.',
      caution:
        'Az ülőhely közel van a helyiség hosszának feléhez (a hossz {offsetFraction}-ára), ahol némely basszus gyengébb.',
      ok: 'Az ülőhely jó messze van a helyiség hosszának felétől.',
      widthNode:
        'A középvonalon ülsz, ahol néhány oldalirányú basszusrezonancia is gyenge. Ez a szimmetrikus sztereó beállítás szokásos kompromisszuma.',
    },
    G02: {
      redFlag:
        'A fejed csak {distance} távolságra van a hátsó faltól: a basszus ott nehéz, és a fal visszaverődése szinte azonnal megérkezik. Told előre az ülőhelyet.',
      caution:
        'A fejed {distance} távolságra van a hátsó faltól: a basszus nehezebb lesz, és korán érkezik a visszaverődés. Ülj előrébb, ha tudsz.',
      ok: 'Az ülőhely mögött van hely ({distance} a hátsó faltól).',
    },
    G03: {
      redFlag:
        'A hangfalak nagyon különböző távolságra vannak az oldalfalaiktól (a különbség {difference}), ezért a sztereó kép az egyik oldalra dől.',
      caution:
        'A hangfalak oldalfaltól mért távolsága között {difference} a különbség, ezért a kép kicsit megdőlhet.',
      ok: 'Mindkét hangfal egyforma távolságra van az oldalfalától.',
      surfaces:
        'A bal fal {left}, a jobb fal viszont {right}, ezért a két csatorna egy kicsit másképp szól.',
    },
    G04: {
      redFlag:
        'Te és a két hangfal {angle} szöget zártok be. A sztereó 60° körül működik a legjobban: ez túl szűk vagy túl széles.',
      caution: 'A hangfalak közötti szög {angle}, kicsit eltér az ideális 60°-tól.',
      info: 'A hangfalak közötti szög {angle}, közel az ideális 60°-hoz.',
      ok: 'A hangfalak közötti szög {angle}: közel az ideális 60°-hoz.',
    },
    G05: {
      redFlag:
        'Az egyik hangfal közelebb van hozzád, mint a másik (közelebb: {closer}; a különbség {difference}), ezért a kép odahúz.',
      caution:
        'Az egyik hangfal közelebb van hozzád, mint a másik (közelebb: {closer}; a különbség {difference}).',
      ok: 'Mindkét hangfal egyforma távolságra van a füledtől.',
    },
    G06: {
      redFlag:
        '{speaker} sarokban áll, ahol minden basszusrezonanciát teljes erővel gerjeszt. Húzd ki onnan.',
      caution: '{speaker} közel van egy sarokhoz: extra, egyenetlen basszusra számíthatsz.',
      ok: 'Egyik hangfal sincs sarok közelében.',
    },
    G07: {
      tooClose:
        'A hangfal hátsó basszusnyílása {clearance} távolságra van a faltól; legalább {minimum} kell neki ({source}).',
      ok: 'A hátsó nyílásnak elég helye van ({clearance}; a minimum {minimum}).',
      unknownPort:
        'Nem tudjuk, hol van a hangfal basszusnyílása. Ha hátul van, tartsd távol a faltól.',
      matchSetting:
        'A hangfalad rendelkezik fal-távolság beállítással: állítsd be a hátulja és a fal közötti {clearance} távolságra.',
    },
    G08: {
      redFlag:
        'A füled {angle}-kal a hangfalak tengelye {direction} van, ami túl meredek: a hang megváltozik. Emeld vagy told lejjebb a hangfalakat, vagy döntsd meg őket.',
      caution:
        'A füled {angle}-kal a hangfalak tengelye {direction} van. Egy kicsivel egyenlőbb magasságban jobban szólna.',
      ok: 'A hangfalak nagyjából fülmagasságba néznek.',
    },
    G09: {
      treatForImaging:
        'A(z) {boundary} ({surface}) visszaveri a hangot az ülőhelyedre. Élesebb képért kezeld azt a pontot.',
      keepForWidth:
        'A(z) {boundary} ({surface}) visszaveri a hangot az ülőhelyedre, ami szélességet ad. Hagyd úgy, ahogy van.',
      bothSchools:
        'A(z) {boundary} ({surface}) visszaveri a hangot az ülőhelyedre. Van, aki élesebb képért kezeli azt a pontot, más a szélesség miatt meghagyja: próbáld ki mindkettőt.',
    },
    G10: {
      obstruction:
        'Egy tárgy ({object}) van a hangfal és a füled között, és eltakarja a hangot. Told arrébb.',
      nearbyHard:
        'Egy kemény tárgy ({object}) {distance} távolságra van {speakerFrom}, és visszaverődésekkel elmossa a hangot.',
      passiveSpeaker:
        'Egy másik hangfal ({object}) {distance} távolságra van {speakerFrom}. Együtt rezeghet: próbáld meg letakarni vagy arrébb tenni, és hallgasd meg.',
    },
    G11: {
      notInFront:
        'A hangfalak melletted vagy mögötted vannak, így ez nem sztereó elrendezés. Tedd őket magad elé, feléd fordítva.',
    },
    H01: {
      overlay:
        'Egy népszerű ökölszabály szerint az ülőhely a helyiség 38%-ánál van: itt ez {listenerY}. Hogy honnan ered, nem világos.',
    },
    H02: {
      overlay:
        'A harmadok szabálya szerint a hangfalak {speakersY} távolságra vannak az elülső faltól, az ülőhely pedig {listenerY}. Ez egy népi szabály.',
    },
    H04: {
      near: 'A mélysugárzó közel van az elülső falhoz ({distance}): a basszusmélypont magasan, {frequency} körül van, nagyjából útból.',
      middle:
        'A mélysugárzó {distance} távolságra van az elülső faltól: a basszusmélypont {frequency} körül esik, ahol a leghallhatóbb. Közelebb, vagy sokkal messzebb általában jobb.',
      far: 'A mélysugárzó messze van az elülső faltól ({distance}): a basszusmélypont mély, {frequency} körül, és keskeny.',
    },
    H05: {
      experiment:
        'A befelé fordítás {toeInLeft}°. Mérések nélkül nem tudjuk megmondani, mi a legjobb: próbálj ki pár fok befelé fordítást és anélkül is, és hallgasd meg.',
    },
    H06: {
      lift: 'A helyiség magas hangjai gyorsan elhalnak ({t60}). Egy kis magashang-emelés ({suggestDb}) segíthet: próbáld ki, és hallgasd meg.',
      cut: 'A helyiség magas hangjai sokáig csengenek ({t60}). Egy kis magashang-csökkentés ({suggestDb}) segíthet: próbáld ki, és hallgasd meg.',
    },
  },
  listen: {
    title: 'Hallgatás és jegyzet',
    intro:
      'A füled a végső próba. Változtass egyetlen dolgot, hallgass, és írd le, mit hallasz. A jegyzetek soha nem változtatják meg, amit az app számol.',
    protocolTitle: 'Így próbálj ki egy változtatást',
    protocol: {
      one: 'Csak egy dolgot változtass, például told el az ülőhelyet 10 cm-rel.',
      two: 'Mindig ugyanazt a három számot játszd: egy középre szőtt hangot, egy basszusos számot és egy tágas zenekari vagy ambient felvételt.',
      three: 'Tartsd ugyanazon a hangerőn, és utána értékeld.',
    },
    adapt: 'A fül órák alatt hozzászokik. Egy kis idő után ítélj, és azonos hangerőn hasonlíts.',
    formTitle: 'Jegyzet ehhez: „{setup}”',
    rating: {
      legend: 'Milyen volt ez a beállítás?',
      scale: '1 = gyenge, 5 = nagyszerű',
      value: '{n} az 5-ből',
    },
    symptoms: 'Mit hallasz? (nem kötelező)',
    duration: {
      legend: 'Mióta hallgatod ezt a beállítást?',
      short: 'Egy óránál rövidebb ideje',
      hours: 'Pár órája',
      days: 'Napok óta',
    },
    text: 'A jegyzeted (nem kötelező)',
    save: 'Jegyzet mentése',
    listTitle: 'Jegyzetek ehhez: „{setup}”',
    empty: 'Ehhez a beállításhoz még nincs jegyzet.',
    delete: 'Jegyzet törlése',
    tryThis: 'Próbáld ki',
    earlier:
      'A beállítás legutóbbi változása előtt értékelted, ezért már nem számít bele az app-pal való összevetésbe.',
    symptom: {
      S01: {
        name: 'Dörmögő, nehéz basszus',
        try: 'Told az ülőhelyet kb. 20 cm-rel előrébb, vagy a hangfalakat kb. 10 cm-rel távolabb a faltól. Ha a hangfalaidon van falkompenzáció, kapcsold be.',
      },
      S02: {
        name: 'Vékony, gyenge basszus',
        try: 'Told az ülőhelyet 15 cm-rel oldalra, előre vagy hátra. Ha a hangfalaidon van elülső fal beállítás, próbáld ki a „közel” és a „távol” állást.',
      },
      S03: {
        name: 'Elmosódott közép, hiányzik a fókusz',
        try: 'Mérd meg mérőszalaggal a távolságot minden hangfaltól az ülőhelyedig, és tedd egyenlővé. Próbáld meg befordítani a hangfalakat feléd.',
      },
      S04: {
        name: 'Szűk hangszínpad',
        try: 'Told szét a hangfalakat egyenként kb. 10 cm-rel, és fordítsd be őket egy kicsit kevésbé.',
      },
      S05: {
        name: 'Éles, harsány magasak',
        try: 'Fordítsd be a hangfalakat egy kicsit kevésbé, puhítsd meg az egyik visszaverődési pontot szőnyeggel vagy függönnyel, vagy ha tudod, vedd vissza a magasakat 0,5 dB-lel.',
      },
      S06: {
        name: 'Tompa, zárt hang',
        try: 'Ellenőrizd, hogy a magassugárzók fülmagasságban vannak-e, vedd el, ami a hangfalak és az ülőhelyed között van, vagy ha tudod, emeld a magasakat 0,5 dB-lel.',
      },
      S07: {
        name: 'A hang az egyik oldalra húz',
        try: 'Először nézd meg a balansz szabályzót. Aztán cseréld meg a bal és a jobb kábelt az erősítőnél: ha a húzás átkerül a másik oldalra, a hiba a hangfalak előtt van (forrás, erősítő, kábel). Ha marad, cseréld meg a két hangfalat: ha a húzás a hangfallal megy, az a hangfal a ludas; ha marad, akkor a szoba.',
      },
    },
    agreement: {
      title: 'A füled és az app',
      notEnough:
        'Értékelj legalább két különböző beállítást, és az app megmondja, hogy a füled és az ő rangsora egyezik-e.',
      agree:
        'Eddig az értékeléseid egyeznek az app rangsorával: amelyik beállítást jobban szeretted, azt az app is magasabbra pontozza.',
      mixed:
        'Az értékeléseid néhány beállításpárnál egyeznek az app rangsorával, másoknál nem. Még néhány jegyzet megmutatja a mintát.',
      disagree:
        'Neked a „{ears}” tetszett a legjobban, de az app a(z) „{app}” beállítást pontozza magasabbra. Az app egyszerűsített modellt használ, ezért itt bízz a füledben. Lehet, hogy a szobában valami másmilyen, mint amit megadtál (felületek, bútorok, hangfal adatok), érdemes ezeket átnézni.',
    },
  },
  compare: {
    title: 'Beállítások összehasonlítása',
    with: 'Összehasonlítás ezzel',
    none: 'Nincs',
    same: 'A két beállítás nagyjából egyformán pontozódik.',
    higher: 'A(z) „{name}” pontozódik magasabbra.',
    legend: '„{name}” beállítás',
    chartNote:
      'A „Basszus az ülőhelyeden” oldalon a másik beállítás a szaggatott vonal, mindegyik a saját ülőhelyénél.',
  },
  print: {
    now: 'A mostani beállításod: „{setup}”',
    best: 'A legjobb talált hely (A)',
    room: 'Szoba: {width} széles, {length} hosszú, {height} magas',
    frontWall: 'Elülső fal',
    wall: { left: 'bal', right: 'jobb' },
    speaker:
      '{side}: a hátlap {front} az elülső faltól, a közepe {sideWall} a(z) {wall} faltól, állvány magassága {height}, befordítás {toeIn}°.',
    seat: 'Ülőhely: {front} az elülső faltól, {left} a bal faltól, a füled {ears} magasan.',
    between:
      'A hangfalak {between} távolságra vannak egymástól, középponttól középpontig. Az ülőhelyedig: {left} (bal) és {right} (jobb), a padló mentén.',
    footer:
      'Ezek előrejelzések, nem mérések. Egyszerre csak egy dolgot változtass, és bízz a füledben.',
  },
  treat: {
    title: 'Még kipróbálhatod',
    intro:
      'Mi segítene a legtöbbet, sorrendben. A méretek durva tájékoztatók, nem ígéretek: változtass meg egyszerre egy dolgot, aztán hallgasd meg.',
    details: 'Részletek',
    first: 'Ha csak egy dolgot tudsz megtenni',
    roomTitle: 'Hangtechnikai kezelés',
    settingsTitle: 'A hangfalaid és ahogyan hallgatod',
    none: 'Ehhez az elrendezéshez nincs javaslatunk.',
    invest: 'Nagyobb befektetés',
    heldBack:
      'Nagyobb megoldások is vannak (panelek, basszuscsapdák). Pénzbe és időbe kerülnek, ezért csak akkor jelennek meg, ha jelzed, hogy készen állsz rájuk.',
    openSettings: 'Bekapcsolom',
    noSettings: 'Ehhez az elrendezéshez nincs mit változtatni a hangfalon.',
    onMap: 'A térképen jelölve ({n}).',
    effect: {
      small: 'Kis hatás',
      moderate: 'Közepes hatás',
      large: 'Nagy hatás',
    },
  },
  mode: {
    chip: 'Basszushang',
    name: 'Basszushang',
    what: 'Hol hangos és hol néma egy basszushang a helyiségedben, a hangfalakkal úgy, ahogy most állnak. Az erős szín hangos, a halvány halk.',
    frequency: 'Frekvencia',
    poorer: 'Halk',
    better: 'Hangos',
    near: 'Helyiségrezonanciák e hang közelében: {modes}.',
    nearNone: 'E hang közelében nincs helyiségrezonancia: a mintázatot sok gyenge rezonancia adja.',
    lowest: 'A legmélyebb rezonanciák',
    axial: 'hosszirányban',
    axialW: 'szélességben',
    axialH: 'magasságban',
    tangential: 'két falpár között',
    oblique: 'mindhárom falpár között',
    jump: 'Ugrás: {frequency}',
    aboveTransition:
      'Kb. {frequency} fölött a szoba rezonanciái összefolynak, ezért a valódi kép jobban eltér ettől.',
    caption:
      'Basszushang {frequency}-en: hol hangos és hol néma (a hangfalak úgy, ahogy most állnak).',
  },
  advice: {
    T01: {
      absorb:
        '{speaker}: a jelölt ponton ({boundary}) érkezik az első visszaverődése. Egy kb. {thickness} vastag porózus panel vagy egy diffúzor ott élesebbé teszi a képet.',
      experiment:
        '{speaker}: az első visszaverődése egy kemény felületre érkezik a jelölt ponton ({boundary}). A szakértők nem értenek egyet abban, hogy kezelni kell-e, ezért próbálj ki ott egy panelt vagy diffúzort (kb. {thickness} vastagot), hallgasd meg, és tartsd meg, ami tetszik.',
    },
    T02: {
      rug: 'Egy vastag szőnyeg a hangfalak és közted, a jelölt ponton, tompítja a padlóról jövő visszaverődést, főleg a magasakban (a basszuson egy szőnyeg alig segít). Olcsó: próbáld ki.',
      ceilingPanel:
        'A mennyezeten a jelölt ponton lévő panel csökkentené a visszaverődését. Ez kevésbé számít, mint az oldalfalak, ezért később jön.',
    },
    T03: {
      moveFirst:
        'A hangfalak mögötti fal kioltja a basszust {frequency} körül az ülőhelyeden. Egy panelnek kb. {quarterWavelength} mélynek kellene lennie, hogy megszüntesse, ami ritkán kivitelezhető: a hangfalak áthelyezése (lásd a legjobb helyeket) jobban működik.',
      thickPanel:
        'A hangfalak mögötti fal kioltja a basszust {frequency} körül az ülőhelyeden. Egy vastag elnyelő (10–20 cm) mögöttük kicsit laposabbá teszi a mélypontot, de meg nem szünteti: ahhoz kb. {quarterWavelength} mélység kellene.',
    },
    T04: {
      corners:
        'A sarkokba tett basszuscsapdák segítenek a {frequency} körüli dörmögésen. Légy reális: 100 Hz alatt nagynak és mélynek kell lenniük, a kis habszivacs ékek alig tesznek valamit.',
    },
    T05: {
      soften:
        'A helyiség visszhangos (az utózengés kb. {t60}). Kb. {absorption} extra puha elnyelés, például egy nagy szőnyeg és vastag függönyök, kb. {after}-re vinné le.',
      liven:
        'A helyiség a tompa oldalon van (az utózengés kb. {t60}). Kb. {absorption} puha elnyelés elvétele, kevesebb szőnyeggel vagy függönnyel, kb. {after}-et adna.',
    },
    T06: {
      moveFirst:
        'A fejed {distance} távolságra van a hátsó faltól. Told előre az ülőhelyet, ha tudod: ez többet segít, mint bármilyen kezelés.',
      absorber:
        'A fejed {distance} távolságra van a hátsó faltól, és az ülőhely nem mozdítható. Tegyél egy vastag elnyelőt (legalább {thickness}) a fejed mögé.',
    },
    C01: {
      desk: 'Asztalnál az asztallap a hangfalak hangját közvetlenül a direkt hang után a füledhez veri vissza, és ez színezi a hangot. Ha kis állványokkal megemeled a hangfalakat és a füled felé fordítod őket, vagy az asztal hátsó szélére teszed, ez a visszaverődés gyengül.',
    },
    C02: {
      quiet:
        'A hangfalaid nagyjából {lowFrequencyMinus6dB}-ig szólnak; a szoba legmélyebb rezonanciája {frequency}, jóval ez alatt, így alig gerjesztik. Azokat a rezonanciákat, amelyeket elérnek, a térkép már figyelembe veszi.',
    },
    C03: {
      bed: 'Az ágyban a füled a párna közelében van, lejjebb, mint ülve. Engedd lejjebb a hangfalakat, vagy döntsd őket lefelé, hogy a magassugárzók a fejed felé nézzenek: a magas hangok a hangfal tengelyében a legegyenletesebbek.',
    },
    D01: {
      match:
        'Állítsd be a hangfal fal-távolság beállítását a hátulja és a fal közötti {clearance} távolságra. {zone}',
    },
    D02: {
      cut: 'A hangfalak közel vannak a falakhoz, ezért a basszus megemelkedik (falhatás: {gain}). Próbálj ki egy lépés basszuscsökkentést a hangfalon ({stepDb}), és hallgasd meg.',
    },
    D03: {
      lift: 'A helyiség elnyeli a magas hangokat (utózengés: {t60}). Próbálj ki egy lépés magashang-emelést ({stepDb}), és hallgasd meg.',
      cut: 'A helyiségben a magas hangok sokáig csengenek (utózengés: {t60}). Próbálj ki egy lépés magashang-csökkentést ({stepDb}), és hallgasd meg.',
    },
    D04: {
      height:
        'A füled {angle}-kal eltér a hangfalak tengelyétől. Tedd a hangfalak alját kb. {baseHeight} magasra a padlótól (állvány vagy asztal), hogy a magassugárzók fülmagasságban legyenek, vagy döntsd meg a hangfalakat.',
      tilt: 'A füled {angle}-kal a hangfalak tengelye alatt van, pedig a hangfalak a padlón állnak. Döntsd őket kicsit lefelé, feléd, vagy ülj egy kicsit magasabbra.',
    },
    D05: {
      moveOut:
        'A hátsó basszusnyílás {clearance} távolságra van a faltól, de {minimum} kell neki. Húzd ki a hangfalakat. A kézikönyv megmondhatja, segítenek-e a nyílásdugók.',
      fixed:
        'A hátsó basszusnyílás {clearance} távolságra van a faltól, de {minimum} kell neki, és a hangfalak nem mozdíthatók. Nézd meg a kézikönyvben, van-e nyílásdugó vagy falközeli beállítás.',
    },
    D06: {
      desk: 'A hangfalad rendelkezik asztali móddal, és a hangfalak asztalon állnak: kapcsold be.',
      stand: 'Használd a hangfal állvány módját: a hangfalak nem asztalon állnak.',
    },
    D07: {
      bassCut:
        'A hangfalak közel állnak a falakhoz, ez megemeli a basszust (falhatás: {gain}). Ha a hangfaladon vagy az erősítődön van mélyszabályzó, próbálj egy kis lépést lefelé, aztán hallgasd meg.',
      trebleLift:
        'A szoba elnyeli a magas hangokat (utózengés {t60}). Ha a hangfaladon vagy az erősítődön van magasszabályzó, próbálj egy kis emelést ({suggestDb}), aztán hallgasd meg.',
      trebleCut:
        'A szobában a magas hangok sokáig csengenek (utózengés {t60}). Ha a hangfaladon vagy az erősítődön van magasszabályzó, próbálj egy kis vágást ({suggestDb}), aztán hallgasd meg.',
    },
  },
  advicePlain: {
    T01: {
      absorb:
        '{speaker}: a hangja a jelölt ponton ({boundary}) egy kemény felületről verődik vissza. Egy puha panel vagy diffúzor ott élesebbé teszi a sztereó képet.',
      experiment:
        '{speaker}: a hangja a jelölt ponton ({boundary}) egy kemény felületről verődik vissza. A vélemények eltérnek: tegyél oda valami puhát, hallgasd meg, és tartsd meg, ami tetszik.',
    },
    T02: {
      rug: 'Egy vastag szőnyeg a padlón közted és a hangfalak között, a jelölt ponton, tompítja a padlóról visszaverődő hangot. Olcsó: próbáld ki.',
      ceilingPanel:
        'Egy panel a mennyezeten a jelölt ponton tompítaná a visszaverődést. Az oldalfalak fontosabbak, azokkal kezdd.',
    },
    T03: {
      moveFirst:
        'A hangfalak mögötti fal a basszus egy részét kioltja az ülőhelyeden. A hangfalak áthelyezése sokkal többet segít bármi falra tehető dolognál: lásd a legjobb helyeket.',
      thickPanel:
        'A hangfalak mögötti fal a basszus egy részét kioltja az ülőhelyeden. Egy vastag elnyelő mögöttük kicsit enyhít ezen, de megszüntetni nem tudja.',
    },
    T04: {
      corners:
        'A sarkokba tett basszuscsapdák lecsendesítik a dübörgő basszust. Nagynak és mélynek kell lenniük: a kis szivacsdarabok alig segítenek.',
    },
    T05: {
      soften: 'A szoba élénk, visszhangos. Egy nagy szőnyeg és nehéz függönyök lecsendesítenék.',
      liven: 'A szoba elég tompa. Kevesebb szőnyeg vagy függöny visszahozna némi életet.',
    },
    T06: {
      moveFirst:
        'A fejed {distance} távolságra van a hátsó faltól. Ha teheted, told előrébb az ülőhelyet: ez mindennél többet segít.',
      absorber:
        'A fejed {distance} távolságra van a hátsó faltól, és az ülőhely nem mozdulhat. Valami vastag, puha a fejed mögött segít.',
    },
    C01: {
      desk: 'Asztalnál az asztallap a füledhez veri vissza a hangot. Emeld meg kicsit a hangfalakat és fordítsd őket a füled felé, vagy tedd őket az asztal hátsó szélére.',
    },
    C02: {
      quiet:
        'A hangfalaid nem szólnak olyan mélyen, mint a szobád legmélyebb búgása, így az nálad csendes marad: eggyel kevesebb gond. Azokat, amelyeket elérnek, a térkép már figyelembe veszi.',
    },
    C03: {
      bed: 'Az ágyban a füled lejjebb van, mint ülve. Engedd lejjebb a hangfalakat, vagy döntsd őket kicsit lefelé, hogy a magassugárzók a párnád felé nézzenek.',
    },
    D01: {
      match:
        'Állítsd be a hangfal fal-távolság beállítását a hátulja és a fal közötti {clearance} távolságra. {zone}',
    },
    D02: {
      cut: 'A hangfalak közel vannak a falakhoz, ettől erősebb a basszus. Próbáld egy lépéssel lejjebb venni a basszust a hangfalon, aztán hallgasd meg.',
    },
    D03: {
      lift: 'A szoba elnyeli a magas hangokat. Próbáld egy lépéssel feljebb venni a magasakat a hangfalon, aztán hallgasd meg.',
      cut: 'A szobában csengenek a magas hangok. Próbáld egy lépéssel lejjebb venni a magasakat a hangfalon, aztán hallgasd meg.',
    },
    D04: {
      height:
        'A magassugárzók nincsenek fülmagasságban. Tedd a hangfalakat kb. {baseHeight} magasra a padlótól (állvány vagy asztal), vagy döntsd őket feléd.',
      tilt: 'A magassugárzók a füled fölé néznek, még a padlón állva is. Döntsd őket kissé lefelé, feléd, vagy ülj kicsit magasabbra.',
    },
    D05: {
      moveOut:
        'A hátsó reflexnyílás csak {clearance} távolságra van a faltól, pedig {minimum} kellene neki. Húzd kicsit előrébb a hangfalakat.',
      fixed:
        'A hátsó reflexnyílás csak {clearance} távolságra van a faltól, pedig {minimum} kellene neki. A kézikönyv szerint lehet, hogy van hozzá dugó vagy falközeli beállítás.',
    },
    D06: {
      desk: 'A hangfalad rendelkezik asztali móddal, és a hangfalak asztalon állnak: kapcsold be.',
      stand: 'Használd a hangfal állvány módját: a hangfalak nem asztalon állnak.',
    },
    D07: {
      bassCut:
        'A hangfalak közel vannak a falakhoz, ettől erősebb a basszus. Ha a hangfaladon vagy erősítődön van mélyszabályzó, vedd kicsit lejjebb, aztán hallgasd meg.',
      trebleLift:
        'A szoba elnyeli a magas hangokat. Ha a hangfaladon vagy erősítődön van magasszabályzó, vedd kicsit feljebb, aztán hallgasd meg.',
      trebleCut:
        'A szobában csengenek a magas hangok. Ha a hangfaladon vagy erősítődön van magasszabályzó, vedd kicsit lejjebb, aztán hallgasd meg.',
    },
  },
  analysis: {
    updating: 'Frissítés…',
    updatingLarge: 'Frissítés… egy ekkora szobánál ez néhány másodpercig tart.',
    error: 'Valami elromlott a számításnál. Az adataid biztonságban vannak.',
    copyDetails: 'Részletek másolása',
  },
  crash: {
    title: 'Ezt a projektet nem tudjuk megjeleníteni',
    body: 'Valami összezavarta az alkalmazást. A többi projekted biztonságban van. Ha meg akarod tartani, mentsd el fájlba, aztán kezdj egy új projektet.',
    export: 'Exportálás fájlba',
    newProject: 'Új projekt indítása',
    details: 'Technikai részletek',
  },
  sheet: {
    expand: 'Több mutatása',
    collapse: 'Kevesebb mutatása',
    index: 'Ugrás ide',
    place: 'Honnan hallgatod',
    treatment: 'Akusztikai kezelés',
  },
  tabs: {
    label: 'Eredmény',
    result: 'Eredmény',
    why: 'Miért',
    tips: 'Tippek',
  },
  whyTab: {
    onMap: 'Nézd meg a térképen',
    onMapHelp:
      'Minden oknak saját térképe van: minél erősebb a szín, annál jobb; a halvány ott van, ahol az az ok ront.',
    closer: 'Közelebbről',
  },
  about: {
    title: 'Névjegy',
    body: 'Az alkalmazás bevett teremakusztikai ismeretekkel javasol hangfal- és ülőhelyet, és megmondja, mennyire biztos a dolgában. Iránymutatás, nem garancia.',
    sources:
      'Minden szabály és a hozzá tartozó források a projekt szabálykatalógusában találhatók.',
    support: 'A projekt támogatása ☕ (új lapon nyílik meg)',
  },
};
