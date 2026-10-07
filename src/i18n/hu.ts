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
    switcher: 'Szobák ezen az eszközön',
    current: 'Aktuális projekt',
    new: 'Új projekt',
    duplicate: 'Másolat készítése',
    rename: 'Átnevezés',
    delete: 'Törlés',
    deleteConfirm: 'Törlöd ezt: „{name}”? Ez nem vonható vissza.',
    saved: 'Elmentve ezen az eszközön',
    unsaved: 'Mentés…',
    unavailable:
      'Nincs mentés: a böngésződ letiltja a tárolást. Ossz meg egy linket, hogy ne vesszen el a munkád.',
    failed:
      'A mentés nem sikerült, lehet, hogy betelt a tárhely. Ossz meg egy linket, hogy ne vesszen el a munkád.',
  },
  menu: {
    label: 'Menü',
    close: 'A menü bezárása',
    room: 'Ez a szoba',
    name: 'Név',
    namePlaceholder: 'Például: nappali',
    nameHelp: 'Nem kötelező. Ha megadod, fent látszik.',
    prefs: 'Beállítások',
    more: 'Egyéb',
    legacy: 'Korábbi változatok',
    image: 'Megosztás képként',
    support: 'A {app} támogatása ☕',
    undo: 'Visszavonás',
    redo: 'Újra',
    share: 'Megosztási link',
    print: 'Nyomtatható lap',
    startOver: 'Újrakezdés',
    startOverConfirm: 'Újrakezded egy üres szobával? Ez a szoba törlődik.',
    about: 'Névjegy és források',
  },
  share: {
    title: 'A beállítás megosztása',
    privacy:
      'A teljes beállítás magában a linkben van. Semmi nem megy ki szerverre, és a linket megnyitó mindenki saját másolatot kap.',
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
  steps: {
    label: 'Lépések',
    setup: 'Szoba és hangfalak',
    place: 'Elhelyezés',
    listen: 'Fülpróba',
  },
  setup: {
    room: {
      title: 'Szoba',
      measured: 'Mérőszalaggal mértem',
      walls: 'Falak',
      floor: 'Padló',
      ceiling: 'Mennyezet',
      assume: 'Nem tudom (feltételezzük: {material})',
      busy: 'Mennyire van berendezve?',
      busyLevel: {
        bare: 'Üres',
        some: 'Néhány bútor',
        busy: 'Zsúfolt',
        veryBusy: 'Nagyon zsúfolt',
      },
      shape: {
        'open-plan-connection': 'Nyitott egy másik helyiség felé',
        'non-rectangular': 'Nem egyszerű téglalap (L alakú, ferde mennyezet)',
        help: 'A modell zárt, téglatest alakú szobát feltételez: ezek bármelyike bizonytalanabbá teszi a basszust. A fülpróba ehhez igazítja a tanácsait.',
      },
    },
    speakers: {
      title: 'Hangfalak',
      manual: 'A kézikönyvből',
      manualHint: 'Hangszórók, pontos méret, legmélyebb hang, szabályzók',
      width: 'Szélesség',
      height: 'Magasság',
      depth: 'Mélység',
      f6: 'Legmélyebb hang (−6 dB), Hz',
      controls: 'Van rajta',
      treble: 'Magasszabályzó',
      bass: 'Mélyszabályzó',
      wall: 'Fal- vagy elhelyezés-beállítás',
      minWall: 'A gyártó által megadott legkisebb faltávolság',
      minWallValue: 'Legkisebb távolság a faltól',
    },
    listen: {
      title: 'Hallgatási hely',
      place: 'Hol hallgatod',
      zone: 'A hangfalak ennyit mozdulhatnak',
      anywhere: 'Bárhová',
      goals: 'Mi a legfontosabb neked',
      exact: 'Pontos helyek',
      exactHint: 'Ha lemérted; vagy húzd őket a rajzon',
      clearance: 'Hangfalak az elülső faltól',
      spacing: 'A hangfalak között',
      seat: 'Ülőhely az elülső faltól',
      ears: 'Fülmagasság ülve',
      stand: 'A hangfal aljának magassága',
      toeIn: 'Befelé fordítás (°)',
      mirror: 'A pár maradjon szimmetrikus',
    },
    notSure: 'Nem tudom',
    next: 'Hová kerüljenek?',
  },
  place: {
    details: 'A részletek',
    detailsHint: 'Miért, az okok a térképen, a basszus az ülőhelyeden',
  },

  field: {
    unusual: 'Biztos, hogy jó? A helyiségek általában {min} és {max} között vannak.',
    outOfRange: '{label}: {min} és {max} közötti értéket adj meg.',
  },
  room: {
    width: 'Szélesség',
    length: 'Hossz',
    height: 'Belmagasság',
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
  speakers: {
    ask: {
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
      placedOn: {
        label: 'Min állnak?',
        floor: 'A padlón',
        stand: 'Állványon vagy polcon',
        desk: 'Asztalon',
      },
    },
  },
  speakerList: {
    find: 'Keresd meg a hangfaladat',
    placeholder: 'Márka vagy típus',
    brands: 'Vagy böngéssz márka szerint',
    models: '{n} típus',
    model: '1 típus',
    found: '{n} találat',
    none: 'Nincs találat erre: „{q}”. Írj kevesebb betűt, vagy írd le a hangfalaidat.',
    notListed: 'Nincs a listán? Írd le inkább',
    useList: 'Inkább megkeresem a listán',
    change: 'Csere',
    cancel: 'Marad: {name}',
    source: 'A gyártó oldaláról, olvasva: {date}',
    edited: 'A gyártó oldaláról, olvasva: {date}. Te módosítottad.',
    photoPort: 'A nyílás helye a gyártó fotóiról van. Nézd meg a sajátod hátulját.',
    special: {
      amt: 'Az AMT (légmozgató) magassugárzót a szobamodell nem ismeri: a magashang-tanácsokat vedd kevésbé biztosnak.',
      planar:
        'A panelhangfal hátrafelé is sugároz: a térkép dobozos hangfalakat modellez, ezért itt kevésbé biztos.',
      dipole:
        'A dipól hátrafelé is sugároz: a térkép dobozos hangfalakat modellez, ezért itt kevésbé biztos.',
      horn: 'A tölcséres hangfalakat a szobamodell nem ismeri: a térkép tanácsait vedd kevésbé biztosnak.',
    },
    details: 'Részletek szerkesztése',
    kind: {
      bookshelf: 'Polchangfal',
      floorstander: 'Álló hangfal',
      monitor: 'Stúdiómonitor',
      desktop: 'Asztali',
      wall: 'Fali',
    },
    category: { passive: 'passzív', active: 'aktív', 'all-in-one': 'mindent-egyben' },
    port: {
      front: 'elülső reflexnyílás',
      rear: 'hátsó reflexnyílás',
      down: 'lefelé néző reflexnyílás',
      side: 'oldalsó reflexnyílás',
      ported: 'reflexes',
      sealed: 'zárt',
      'passive-radiator': 'passzív membrán',
      'open-baffle': 'nyitott hangfal',
    },
    f6: '−6 dB: {hz} Hz',
    f6About: '−6 dB: kb. {hz} Hz',
  },
  goals: {
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
    },
  },
  survey: {
    start: 'Kezdjük',
    welcome: {
      title: 'Hová kerüljenek a hangfalaid?',
      body: 'Válaszolj néhány gyors kérdésre a szobádról, és megmutatjuk, hová tedd a hangfalaidat és hová ülj, mielőtt bármi mást kérnénk.',
      free: 'Ingyenes, regisztráció és e-mail-cím nélkül.',
      private: 'A szobád adatai ezen az eszközön maradnak.',
      short: 'Három rövid kérdés, nem egészen egy perc.',
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
      find: 'Keresd meg a típusodat a listán, vagy írd le, ha nincs rajta.',
    },
  },
  guess: {
    note: 'Elhelyeztünk egy első javaslatot: az ülőhely a szoba hosszának {share}-ánál, a hangfalak vele egyenlő oldalú háromszögben. Húzd őket a térképen oda, ahol nálad vannak.',
    short: 'Első javaslat. Húzd a hangfalakat és az ülőhelyet oda, ahol nálad vannak.',
    ok: 'Így jó',
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
    lowest: 'A legmélyebb rezonanciája {f}.',
    numbers: 'Utózengés {t60} s.',
  },
  listen: {
    title: 'Hogyan szól?',
    intro:
      'Játssz le egy jól ismert dalt, és hallgasd egy-két percig a helyedről. Aztán mondd el, mit hallasz. Nem vagy biztos benne? Hagyd üresen.',
    group: { bass: 'Basszus', tone: 'Hangszín', image: 'Sztereókép', room: 'Szoba' },
    aspect: {
      bass: { label: 'Mennyi', thin: 'Vékony', right: 'Épp jó', boomy: 'Dörmögő' },
      low: {
        label: 'Legmélyebb hangok',
        there: 'Megvannak',
        missing: 'Hiányoznak: nincs orgonapedál, nincs mély szintibasszus',
      },
      evenness: {
        label: 'Egyenletesség',
        even: 'Egyenletesek',
        uneven: 'Néhány kiugrik vagy eltűnik',
      },
      voices: { label: 'Énekhang', clear: 'Tiszta', muffled: 'Tompa, dobozos vagy távoli' },
      treble: {
        label: 'Magas hangok',
        dull: 'Tompa',
        right: 'Épp jó',
        bright: 'Éles, vagy sziszegnek az sz-ek',
      },
      centre: {
        label: 'Az ének középen',
        vague: 'Elmosódott',
        focused: 'Pontos',
        left: 'Balra húz',
        right: 'Jobbra húz',
      },
      width: { label: 'Szélesség', narrow: 'Szűk', right: 'Épp jó', wide: 'Lyuk középen' },
      depth: {
        label: 'Mélység',
        deep: 'Rétegzett, elölről hátra',
        flat: 'Lapos, minden egy sorban',
      },
      spot: { label: 'Jó hely', wide: 'Elég tág', small: 'Csak egy pontban szól jól' },
      clarity: {
        label: 'Visszhang',
        clear: 'Tiszta',
        some: 'Kicsit visszhangos',
        echoey: 'Visszhangos',
      },
    },
    short: {
      bass: { thin: 'Vékony', right: 'Jó', boomy: 'Dörmögő' },
      low: { there: 'Megvan', missing: 'Hiányzik' },
      evenness: { even: 'Egyenletes', uneven: 'Egyenetlen' },
      voices: { clear: 'Tiszta', muffled: 'Tompa' },
      treble: { dull: 'Tompa', right: 'Jó', bright: 'Éles' },
      centre: { vague: 'Elmosódott', focused: 'Pontos', left: '◂ Balra', right: 'Jobbra ▸' },
      width: { narrow: 'Szűk', right: 'Jó', wide: 'Lyukas' },
      depth: { deep: 'Mély', flat: 'Lapos' },
      spot: { wide: 'Tág', small: 'Szűk' },
      clarity: { clear: 'Tiszta', some: 'Kicsit zeng', echoey: 'Zengő' },
    },
    sounds: {
      title: 'Teszthangok',
      hint: 'Bal, jobb, közép, polaritás és basszussöprés, a hangfalaidon',
      safety:
        'Előbb vedd le a hangerőt, aztán told fel a szokásos szintre. Az eszköznek a hangfalaidon kell szólnia. Semmit nem veszünk fel.',
      phase: 'Most: {phase}',
      left: {
        name: 'Bal',
        listen:
          'Csak a bal hangfalból kell szólnia. A jobból szól? Fel vannak cserélve a csatornák.',
      },
      right: {
        name: 'Jobb',
        listen:
          'Csak a jobb hangfalból kell szólnia. A balból szól? Fel vannak cserélve a csatornák.',
      },
      centre: {
        name: 'Közép',
        listen:
          'Mindkét hangfal ugyanazt szólja: egyetlen keskeny pontnak kell lennie középen. Elmosódott vagy oldalra húz? Válaszolj Az ének középen sorban.',
      },
      polarity: {
        name: 'Polaritás',
        listen:
          'Előbb A, aztán B, az egyik oldal megfordítva. Az A-nak teltebbnek és középre összpontosultabbnak kell lennie. Ha a B az, az egyik hangfal + és − fordítva van bekötve: cseréld fel a két vezetékét.',
      },
      sweep: {
        name: 'Basszussöprés',
        listen:
          'Lassú hang 35-től 180 Hz-ig. Amelyik hang kiugrik vagy eltűnik, az a szoba rezonanciája: válaszolj az Egyenletesség sorban.',
      },
    },
    fixesFor: 'Mit próbálj ki: {aspect}',
    confidence: {
      physics: 'Általában segít',
      guideline: 'Gyakran segít',
      heuristic: 'Néha segít',
      subjective: 'Fül alapján: a hangfaltól függ',
    },
    model: {
      better: 'A szoba modellje szerint segít.',
      same: 'A szoba modellje szerint nagyjából ugyanaz.',
      worse: 'A szoba modellje szerint rosszabb; a füled lehet, hogy mást mond.',
    },
    tryIt: 'Kipróbálom',
    tried: 'Kipróbáltam',
    how: 'Kipróbáltad: {what} Milyen lett?',
    result: { better: 'Jobb', same: 'Ugyanolyan', worse: 'Rosszabb', open: 'Még nincs értékelve' },
    putBack: 'Visszaállítás',
    history: 'Amit kipróbáltál',
    nothing:
      'Ehhez itt nincs mit mozgatni. Nézd meg lent a szobára vonatkozó ötleteket, vagy bízz a füledben.',
    noLonger: 'Ez a változtatás már nem fér bele a szobába, ahogy most áll.',
    roomIdeas: 'Ötletek a szobához',
    roomIdeasHint: 'Szőnyeg, függöny, és ha szánnál rá, akusztikai kezelés',
    exp: {
      L01: {
        out: 'Húzd mindkét hangfalat {by}-rel messzebb a mögöttük lévő faltól.',
        seatForward: 'Ülj {by}-rel előrébb, távolabb a hátsó faltól.',
        inward: 'Húzd mindkét hangfalat {by}-rel beljebb az oldalfaltól.',
        wallSwitch: 'Állítsd a hangfalak falkapcsolóját aszerint, milyen közel állnak a falhoz.',
        plug: 'Ha a hangfalaidhoz járt szivacsdugó a basszusnyílásba, próbáld ki.',
        control: 'Ha a hangfalon vagy az erősítőn van mélyszabályzó, vedd le egy lépéssel.',
        controlKnown: 'Vedd lejjebb egy fokkal a mélyszabályzót (kb. 2 dB).',
        onDesk: 'Tegyél valami nehezet és tömöret mindkét hangfal alá, vagy próbáld állványon.',
        onStand:
          'Ha az állványok könnyűek vagy üregesek, próbálj nehezebbet, vagy töltsd fel őket.',
        onFloor: 'Adj a hangfalaknak szilárd alátámasztást a fapadlón: tüskéket vagy nehéz talpat.',
      },
      L02: {
        closer: 'Told mindkét hangfalat {by}-rel közelebb a mögöttük lévő falhoz.',
        seatOffMiddle: 'Vidd az ülőhelyed {by}-rel távolabb a szoba közepétől.',
        door: 'Ha a szomszéd szoba felé nyíló résznek van ajtaja, csukd be, és hallgasd meg újra.',
        small: 'A kis hangfalak basszusa hamar elfogy: ez a méretük, nem a szobád.',
        control: 'Ha a hangfalon vagy az erősítőn van mélyszabályzó, adj rá egy lépést.',
        controlKnown: 'Adj rá egy fokot a mélyszabályzóra (kb. 2 dB).',
      },
      L03: {
        seatStep:
          'Mozdítsd az ülőhelyed {by}-rel, hallgasd meg ugyanazt a dalt, aztán próbáld {by}-rel a másik irányba.',
        speakerStep: 'Húzd mindkét hangfalat {by}-rel messzebb a faltól, és hallgasd meg újra.',
      },
      L04: {
        centreSeat: 'Mozdítsd az ülőhelyed {by}-rel oldalra, a két hangfal közé középre.',
        polarity: 'Ellenőrizd a bekötést: piros a pirosra, fekete a feketére, mindkét hangfalon.',
        toeIn: 'Fordítsd mindkét hangfalat {by}-kal jobban feléd.',
        height: 'Hozd a magassugárzókat a füled magasságába.',
        balance: 'Nézd meg, hogy az erősítő balanszszabályzója középen áll-e.',
        swap: 'Cseréld fel a bal és a jobb kábelt az erősítőn.',
      },
      L05: {
        wider: 'Vidd a hangfalakat {by}-rel távolabb egymástól.',
        narrower: 'Vidd a hangfalakat {by}-rel közelebb egymáshoz.',
        sitCloser: 'Ülj {by}-rel közelebb a hangfalakhoz.',
        sitBack: 'Ülj {by}-rel hátrébb.',
        lessToeIn: 'Fordítsd a hangfalakat {by}-kal kevésbé feléd.',
        moreToeIn: 'Fordítsd a hangfalakat {by}-kal jobban feléd.',
      },
      L06: {
        lessToeIn: 'Fordítsd a hangfalakat {by}-kal kevésbé feléd.',
        moreToeIn: 'Fordítsd a hangfalakat {by}-kal jobban feléd.',
        height: 'Hozd a magassugárzókat a füled magasságába.',
        soften:
          'Tegyél valami puhát oda, ahol a hang először visszaverődik: szőnyeget közéd és a hangfalak közé, függönyt.',
        softenWalls:
          'Tegyél valami puhát a melletted lévő csupasz falakra: függönyt, falikárpitot.',
        surface:
          'Keress egy kemény, fényes felületet a hang útja mellett: üvegasztalt, csupasz asztallapot, ablakot. Mozdítsd el, fordítsd el, vagy takard le.',
        trebleDown: 'Ha a hangfalon vagy az erősítőn van magasszabályzó, vedd le egy lépéssel.',
        trebleUp: 'Ha a hangfalon vagy az erősítőn van magasszabályzó, adj rá egy lépést.',
        trebleDownKnown: 'Vedd lejjebb egy fokkal a magasszabályzót (kb. 1 dB).',
        trebleUpKnown: 'Adj rá egy fokot a magasszabályzóra (kb. 1 dB).',
      },
      L07: {
        sitCloser: 'Ülj {by}-rel közelebb a hangfalakhoz.',
        flutter:
          'Tapsolj egyet a helyeden. Ha utána gyors, csengő „cing” hallatszik, az csörgővisszhang: tegyél egy tárgyat az egyik csupasz falra, amelyek között cseng.',
        toeIn: 'Fordítsd a hangfalakat {by}-kal jobban feléd.',
        soften: 'Tegyél puha dolgokat a kemény felületekre: szőnyeget, függönyt, párnákat.',
        softenWalls: 'Tegyél puha dolgokat a csupasz falakra és ablakokra: függönyt, falikárpitot.',
      },
      L08: {
        dip: 'Told mindkét hangfalat {by}-rel közelebb a mögöttük lévő falhoz.',
        seatOffMiddle: 'Vidd az ülőhelyed {by}-rel távolabb a szoba közepétől.',
        seatBack: 'Ülj {by}-rel hátrébb, de ne közvetlenül a falhoz.',
        door: 'Ha a szomszéd szoba felé nyíló résznek van ajtaja, csukd be, és hallgasd meg újra.',
        small: 'A hangfalaid nagyjából {hz}-ig szólnak le: a legmélyebb hangok ez alatt vannak.',
      },
      L09: {
        desk: 'Hozd a hangfalakat az asztal elülső széléhez, és döntsd őket a füled felé.',
        height: 'Hozd a magassugárzókat a füled magasságába.',
        bassFirst: 'Először a dörmögő basszust szelídítsd meg (lásd fent a Basszust).',
        onDesk: 'Tegyél valami nehezet és tömöret mindkét hangfal alá, vagy próbáld állványon.',
        closer: 'Ülj {by}-rel közelebb a hangfalakhoz.',
      },
      L10: {
        out: 'Húzd mindkét hangfalat {by}-rel messzebb a mögöttük lévő faltól.',
        lessToeIn: 'Fordítsd a hangfalakat {by}-kal kevésbé feléd.',
        clear:
          'Vidd el a nagy, kemény tárgyakat a hangfalak közül (általában a tévé az), vagy told hátrébb őket.',
      },
      L11: {
        crossFront:
          'Fordítsd a hangfalakat {by}-kal jobban feléd, hogy a tengelyük épp előtted keresztezze egymást.',
        sitBack: 'Ülj {by}-rel hátrébb.',
      },
    },
    why: {
      L01: {
        out: 'A hangfal mögötti közeli fal felerősíti a basszust; egy kis hely elvesz belőle.',
        seatForward: 'Közvetlenül a hátsó falnál minden basszusrezonancia a leghangosabb.',
        inward: 'A közeli oldalfal vagy sarok is erősíti a basszust.',
        wallSwitch:
          'Azt mondtad, van ilyen a hangfalon: pont azt a basszust veszi vissza, amit a közeli fal hozzáad. A kézikönyv megmondja, melyik állás melyik.',
        plug: 'A gyártók épp erre adják: falközelben dörmögő basszusra. Nem minden hangfalhoz jár.',
        control: 'Egy kis lépés elég. Hallgasd egy ideig, mielőtt döntesz.',
        controlKnown: 'Azt mondtad, van ilyen. Egy kis lépés elég; hallgasd egy ideig.',
        onDesk:
          'Egy üreges asztal együtt düböröghet a hangfalakkal. Hogy mennyire, az nagyon változó: hallgasd meg.',
        onStand:
          'Egy könnyű állvány együtt zenghet a hangfallal. Hogy mennyire, az nagyon változó: hallgasd meg.',
        onFloor:
          'A fapadló együtt düböröghet az álló hangfalakkal. Hogy mennyire, az nagyon változó: hallgasd meg.',
      },
      L02: {
        closer:
          'A hangfal mögötti fal erősíti a basszust. A basszusnyílás megkapja a szükséges helyet.',
        seatOffMiddle: 'A szoba hosszának felénél a legmélyebb hangok kioltják egymást.',
        door: 'Egy nyílás úgy engedi ki a basszust, mint egy nyitott ablak. Ha becsukva teltebb, ez volt az.',
        small: 'A falhoz közelebb kicsit visszajön; azon túl ez a hangfal határa.',
        control: 'Óvatosan: a több basszus a kis hangfalakat is jobban terheli.',
        controlKnown:
          'Azt mondtad, van ilyen. Óvatosan: a több basszus a kis hangfalakat is jobban terheli.',
      },
      L03: {
        seatStep:
          'A szoba basszusrezonanciái kis távolságon is változnak: az egyik pont gyakran egyenletesebb a másiknál.',
        speakerStep:
          'A hangfalak mozgatása azt is változtatja, mely mély hangokat emeli ki a szoba.',
      },
      L04: {
        centreSeat: 'A közelebbi hangfal maga felé húzza a hangot; néhány centi elég.',
        polarity:
          'Ha az egyik hangfal fordítva van bekötve, kioltja a középet és a basszust. A Teszthangok polaritáspróbája tíz másodperc alatt megmondja.',
        toeIn:
          'Ha feléd néznek, a közép gyakran határozottabb. A hangfaltól függ: bízz a füledben.',
        height: 'Állvány, néhány könyv a hangfal alá, vagy egy kis döntés feléd.',
        balance: 'Ez a legegyszerűbb oka annak, ha a hang az egyik oldalra húz.',
        swap: 'Ha a hang átkerül a másik oldalra, a forrás vagy az erősítő az ok. Ha nem, cseréld fel a hangfalakat: ha a hangfallal megy, az a hangfal; ha egyikkel sem, a szoba.',
      },
      L05: {
        wider:
          'Távolabb egymástól kinyílik a hangkép. A szokásos elrendezésben 60°-ra vannak egymástól, az ülőhelyedről nézve.',
        narrower: 'Túl messze egymástól kiürül a hangkép közepe.',
        sitCloser: 'Közelebbről a két hangfal szélesebben vesz körül.',
        sitBack: 'Távolabbról a két hangfal újra összeér középen.',
        lessToeIn:
          'Ha kicsit melléd néznek, szélesebb lehet a hangkép. A hangfaltól függ: bízz a füledben.',
        moreToeIn: 'Több befordítás kitölti a közepet. A hangfaltól függ: bízz a füledben.',
      },
      L06: {
        lessToeIn: 'A legtöbb hangfal magas hangja a tengelyén kívül kicsit lágyabb.',
        moreToeIn: 'A legtöbb hangfal egyenesen előre a legfényesebb.',
        height: 'A magas hang akkor a legtisztább, ha a magassugárzók a füledre néznek.',
        soften:
          'A csupasz padló és fal fényessé teszi a szobát; a puha dolgok ott, ahol a hang először visszaverődik, megnyugtatják. Használd, ami van.',
        softenWalls: 'A padlód már puha; a csupasz falak maradtak. Használd, ami van.',
        surface:
          'A szobád már tele van puha dolgokkal, abból nincs hiány. Egyetlen kemény felület a hang útja mellett egyenesen visszaküldi a magasakat.',
        trebleDown: 'Egy kis lépés. Hallgasd néhány napig, mielőtt döntesz.',
        trebleUp: 'Egy kis lépés. Hallgasd néhány napig, mielőtt döntesz.',
        trebleDownKnown: 'Azt mondtad, van ilyen. Egy kis lépés; hallgasd néhány napig.',
        trebleUpKnown: 'Azt mondtad, van ilyen. Egy kis lépés; hallgasd néhány napig.',
      },
      L07: {
        sitCloser:
          'Közelebbről többet hallasz a hangfalakból és kevesebbet a szoba visszhangjából.',
        flutter:
          'Egy berendezett szoba, amely mégis cseng, ritkán szenved párnahiányban: a hang két csupasz, párhuzamos felület között pattog oda-vissza. Egy tárgy az egyiken megtöri.',
        toeIn: 'Kevesebb hang jut először az oldalfalakra. A hangfaltól függ: bízz a füledben.',
        soften: 'Rövidítik a szoba visszhangját. Használd, ami már megvan.',
        softenWalls: 'Rövidítik a szoba visszhangját. A padlód már puha.',
      },
      L08: {
        dip: 'A mögöttük lévő fal visszaküld egy másolatot, amely {hz} körül kioltja a hangot, épp a mélybasszusban. A falhoz közel a völgy kiemelkedik a basszusból, és a fal inkább súlyt ad.',
        seatOffMiddle: 'A szoba hosszának felénél a legmélyebb hangok kioltják egymást.',
        seatBack:
          'Minden hosszanti rezonancia a hátsó falnál a leghangosabb, így hátrébb ülve nőnek a legmélyebb hangok.',
        door: 'Egy nyílás úgy engedi ki a legmélyebb hangokat, mint egy nyitott ablak.',
        small: 'Ez a méretük, nem a szobád. A falhoz közelebb kicsit visszajön.',
      },
      L09: {
        desk: 'Az asztallap a közvetlen hang után rögtön a füledbe veri vissza az énekhang tartományát, és a kettő részben kioltja egymást. Az elülső szélnél a visszaverődés elkerüli az asztalt.',
        height: 'Az ének akkor a legtisztább, ha a magassugárzók a füledre néznek.',
        bassFirst:
          'A túl sok basszus elfedi az énekhang alsó részét: ha azt rendbe teszed, az ének gyakran magától visszajön.',
        onDesk:
          'Egy üreges asztal együtt zeng, és dobozos színt ad. Hogy mennyire, az nagyon változó: hallgasd meg.',
        closer: 'A hangfalaktól messze az ének nagyobb része később, a szobából érkezik.',
      },
      L10: {
        out: 'A hangfalak mögötti hely gyakran segít, hogy a hangkép mélységben kinyíljon. Fül alapján: nincs olyan tanulmány, amely megmondja, mennyire.',
        lessToeIn: 'Kicsit több szobahang mélységet adhat. A hangfaltól függ: bízz a füledben.',
        clear:
          'A hangfalak közti és melletti nagy tárgyak korán visszaverik a hangot, és laposabbá teszik a képet. A mélység nagy része magában a felvételben van.',
      },
      L11: {
        crossFront:
          'Ha az egyik hangfal felé dőlsz, a tengelyéről is lejjebb kerülsz, így halkabb lesz, miközben közelebb kerül, és az ének középen marad. Azoknál a hangfalaknál működik a legjobban, amelyek oldalt halkabbak: hallgasd meg.',
        sitBack:
          'Hátrébb egy oldallépés kevésbé változtatja a két távolságot. A hangkép kicsit szűkebb lesz.',
      },
    },
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
    moreTips: 'Hallgasd meg és finomhangold',
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
    toeIn: 'Befelé fordítás',
    aim: 'Befelé fordítás {deg}: {where}',
    cross: {
      front: 'a tengelyek előtted keresztezik egymást',
      at: 'a tengelyek nálad keresztezik egymást',
      behind: 'a tengelyek mögötted keresztezik egymást',
      parallel: 'a hangfalak egyenesen előre néznek',
    },
    dip: 'Az elülső fal okozta völgy itt: {f}, {band}',
    band: { deep: 'mélybasszus', upper: 'felső basszus', above: 'a basszus fölött' },
    dimmed: 'Nem ajánlott',
    bestPlacement: 'Legjobb elhelyezés: {word}',
    bestSeat: 'Legjobb ülőhely: {word}',
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
      what: 'Hol szólnának a legjobban a hangfalak, ha az ülőhelyed marad. Az erősebb szín jobb.',
    },
    overall: {
      name: 'Összesített',
      what: 'Mennyire jó itt az ülőhely, mindent egyformán számítva. Minél erősebb a szín, annál jobb.',
    },
    goals: {
      name: 'A céljaid',
      what: 'Mennyire jó az ülőhely itt, ha a hangfalak maradnak. Az erősebb szín jobb.',
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
    G11: {
      notInFront:
        'A hangfalak melletted vagy mögötted vannak, így ez nem sztereó elrendezés. Tedd őket magad elé, feléd fordítva.',
    },
    G12: {
      onDesk:
        'Az asztallapról visszaverődő hang {delayMs} késéssel ér a füledhez a direkt hanghoz képest, és {frequency} körül (meg feljebb ismét) gyengíti a hangot. Hogy mennyire, az attól függ, mennyi hangot sugároznak a hangfalaid lefelé. A térkép nem számol az asztallal.',
      clear:
        'A füledhez tartó visszaverődés nem az asztallapra esik, így az asztal alig színezi a hangot.',
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
      desk: 'Asztalnál az asztallap a hangfalak hangját közvetlenül a direkt hang után a füledhez veri vissza, és ez színezi a hangot. Ha kis állványokkal megemeled a hangfalakat, és lefelé, a füled felé fordítod őket, kevesebb hang jut az asztalra, így ez a visszaverődés gyengül.',
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
      desk: 'Asztalnál az asztallap a füledhez veri vissza a hangot. Emeld meg kicsit a hangfalakat, és fordítsd őket a füled felé.',
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
    title: 'Ezt a szobát nem tudjuk megjeleníteni',
    body: 'Valami összezavarta az alkalmazást. Kezdd újra egy üres szobával; más nem vész el.',
    newProject: 'Újrakezdés',
    details: 'Technikai részletek',
  },
  whyTab: {
    onMap: 'Nézd meg a térképen',
    onMapHelp:
      'Minden oknak saját térképe van: minél erősebb a szín, annál jobb; a halvány ott van, ahol az az ok ront.',
    closer: 'Közelebbről',
  },
  model: {
    note: 'Egy üres doboz fizikai modellje: kiindulópont, nem mérés.',
    more: 'Mit tud',
  },
  variant: {
    current: 'Jelenlegi',
  },
  dock: {
    room: 'Helyiség',
    side: 'Oldalnézet',
  },
  nav: {
    bass: 'Basszus az ülőhelyeden',
  },
  sheet: {
    expand: 'Több mutatása',
    collapse: 'Kevesebb mutatása',
  },
  about: {
    title: 'A {app} névjegye',
    lead: 'Fizikán alapuló kiindulópont, hogy az estét zenehallgatással töltsd, ne találgatással.',
    knowsTitle: 'Amit egy doboz elárul',
    knows:
      'A {app} a szobádat téglatest alakú dobozként kezeli, és ebből a nagy, lassú dolgokat számolja ki: a szoba basszusrezonanciáit, a hangfalak melletti falakról visszaverődő hang okozta völgyeket, az ülőhelyedhez érkező első visszaverődéseket és a közted és a hangfalak közti sztereó háromszöget.',
    earsTitle: 'Amihez a füled kell',
    ears: 'Egy alaprajz nem hallja, hogyan szórják szét a hangot a hangfalaid, hogyan veri vissza egy kanapé vagy egy könyvespolc, és mennyire egyenetlenül nyeli el a szobád. Ezeket egy mérőmikrofon megmutatja, a füled pedig meg tudja ítélni.',
    judge:
      'Minden szoba más. A {app} közel visz a célhoz; utána egyszerre csak egy dolgot változtass, olyan zenét hallgass, amit kívülről ismersz, és bízz abban, amit hallasz.',
    sources:
      'Minden szabály a képletével és a forrásaival együtt a projekt szabálykatalógusában található.',
  },
};
