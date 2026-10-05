/** English messages: the source of truth for message keys (docs/I18N_AND_UNITS.md §2). */
export const en = {
  app: {
    tagline: 'Find good positions for your speakers and your seat, based on room acoustics.',
    skipToContent: 'Skip to content',
    disclaimer: 'Guidance, not a guarantee. Your ears have the final say.',
  },
  language: {
    label: 'Language',
    en: 'English',
    hu: 'Magyar',
  },
  theme: {
    label: 'Theme',
    auto: 'Match device',
    light: 'Light',
    dark: 'Dark',
  },
  units: {
    label: 'Units',
    metric: 'Metric (m, cm)',
    imperial: 'Imperial (ft, in)',
    error: {
      invalid: 'Not a length we understand. Try 3.5 m, 350 cm or 11′ 6″.',
      notPositive: 'The length must be greater than zero.',
      ambiguousFeetInches: 'Feet and inches need marks, like 11′ 6″ or 11 ft 6 in.',
    },
  },
  project: {
    untitled: 'Untitled room',
    copySuffix: 'copy',
    switcher: 'Projects',
    current: 'Current project',
    new: 'New project',
    duplicate: 'Duplicate',
    rename: 'Rename',
    renameLabel: 'Project name',
    delete: 'Delete',
    deleteConfirm: 'Delete “{name}”? This cannot be undone.',
    saved: 'Saved on this device',
    unsaved: 'Saving…',
    unavailable: 'Not saved: your browser blocks storage. Use Export to keep your work.',
    failed: 'Could not save: storage may be full. Use Export to keep your work.',
  },
  menu: {
    image: 'Share as image',
    label: 'Menu',
    undo: 'Undo',
    redo: 'Redo',
    share: 'Share link',
    export: 'Export file',
    import: 'Import file',
    print: 'Print sheet',
    about: 'About and sources',
  },
  share: {
    title: 'Share this setup',
    privacy:
      'The whole setup is stored inside the link itself. Nothing is sent to a server, and anyone with the link can open a copy.',
    includeNotes: 'Include my listening notes',
    copy: 'Copy link',
    copied: 'Link copied',
    copyFailed: 'Could not copy automatically. Select the link and copy it by hand.',
    linkLabel: 'Share link',
    close: 'Close',
  },
  import: {
    success: 'Opened “{name}” as a new project.',
    error: {
      notJson: 'This is not a readable project file.',
      tooBig: 'This file or link is too large to be a project.',
      notAProject: 'This file or link does not contain a project.',
      newerVersion: 'This project was made with a newer version of the app.',
      invalid: 'This project could not be read: {detail}',
      tooMany: 'You have too many saved projects. Delete one first.',
    },
    dismiss: 'Dismiss',
  },
  image: {
    subtitle: 'Room {width} × {length}',
    needRoom: 'Enter the room size first, then there is something to share.',
    failed: 'The picture could not be made in this browser.',
  },
  notice: { undo: 'Undo' },
  confidence: {
    label: 'How sure are we?',
    step: {
      1: 'Rough guess',
      2: 'First impression',
      3: 'Solid',
      4: 'Detailed',
      5: 'As good as it gets without measurements',
    },
    hintTitle: 'What would improve this?',
    hint: 'Tell us more about “{input}” to firm things up.',
    nothingMore: 'Nothing more to add: this is as certain as the inputs allow.',
    capsTitle: 'Limits of the model',
    cap: {
      nonRectangular: 'Your room is not rectangular, so we can only give a very rough picture.',
      outOfModel: 'Your room has features we cannot model. Treat the bass results as rough.',
      lightweightWalls:
        'Lightweight walls let bass leak out, so the bass predictions are less reliable.',
      lowConfidenceSurface: 'We know little about the surfaces where the first reflections land.',
    },
  },
  input: {
    room: {
      width: 'room width',
      length: 'room length',
      height: 'ceiling height',
      construction: 'wall construction',
    },
    speakers: {
      position: 'speaker positions',
    },
    listener: {
      position: 'seat position',
    },
    surfaces: 'wall surfaces',
    furnishing: 'furnishing',
    speaker: {
      lowFrequencyMinus6dB: 'speaker bass extension',
      directivity: 'speaker dispersion',
      portLocation: 'bass port location',
      enclosure: 'speaker enclosure type',
      acousticAxisHeight: 'tweeter height',
      driverLayout: 'driver layout',
    },
  },
  steps: { room: 'Room' },
  field: {
    unusual: 'Is that right? Rooms are usually between {min} and {max}.',
    outOfRange: '{label} must be between {min} and {max}.',
    neededToStart: 'Needed to start',
    certainty: {
      label: 'How sure are you?',
      measured: 'Measured',
      estimated: 'Estimated',
      unknown: 'Don’t know',
    },
  },
  room: {
    title: 'Your room',
    intro: 'Rough numbers are fine. Say how sure you are, and refine them later.',
    width: 'Width',
    length: 'Length',
    height: 'Ceiling height',
    widthHelp: 'Wall to wall, across the room.',
    lengthHelp: 'From the wall behind the speakers to the wall behind you.',
    heightHelp: 'Floor to ceiling.',
    construction: {
      legend: 'The walls are mostly…',
      solid: 'Solid (brick, concrete)',
      lightweight: 'Lightweight (plasterboard)',
      unknown: 'Not sure',
      help: 'Lightweight walls let bass leak through, which makes bass predictions less certain.',
    },
    outOfModel: {
      legend: 'Does the room have any of these?',
      help: 'We can’t model these. They lower our confidence in the bass results.',
      'open-doorway': 'A large open doorway',
      'open-plan-connection': 'An opening to another room',
      alcove: 'An alcove or recess',
      'slanted-ceiling': 'A slanted ceiling',
      'non-rectangular': 'Not really rectangular',
    },
    temperature: {
      summary: 'Advanced: room temperature',
      label: 'Temperature',
      help: 'Sound travels slightly faster in warm air. We assume 20 °C if you leave this empty.',
    },
  },
  boundary: {
    front: 'Front wall (behind the speakers)',
    back: 'Back wall (behind you)',
    left: 'Left wall',
    right: 'Right wall',
    floor: 'Floor',
    ceiling: 'Ceiling',
    short: {
      front: 'Front',
      back: 'Back',
      left: 'Left',
      right: 'Right',
      floor: 'Floor',
      ceiling: 'Ceiling',
    },
  },
  surface: {
    'plaster-concrete': 'Plaster or concrete',
    'plaster-brick': 'Plastered brick',
    'plaster-lath': 'Plaster on wooden lath (old house)',
    'gypsum-stud': 'Plasterboard',
    glass: 'Glass or window',
    'wood-floor': 'Wooden floor',
    'carpet-heavy': 'Thick carpet',
    'carpet-underlay': 'Carpet on underlay',
    'curtain-heavy': 'Heavy curtain',
    'shelf-diffusive': 'Bookshelf or CD wall',
    'canvas-art': 'Painting or canvas',
    custom: 'Custom',
    class: {
      reflective: 'reflects sound',
      absorptive: 'soaks up sound',
      diffusive: 'scatters sound',
    },
  },
  surfaces: {
    title: 'Surfaces',
    intro:
      'What the room is made of changes how it sounds. Guesses are fine; this step is optional.',
    pick: 'Which surface?',
    base: 'What is the {name} made of?',
    dontKnow: 'I don’t know',
    dontKnowHelp: 'We’ll assume {material}.',
    dontKnowShort: 'I don’t know ({material})',
    row: { walls: 'Walls', floor: 'Floor', ceiling: 'Ceiling' },
    mixed: 'Different on each wall',
    eachWall: 'Each wall separately',
    addThings: 'Add something on a wall',
    addThingsHint: 'Windows, shelves, curtains, paintings',
    needRoom: 'Enter the room size first, then you can describe the surfaces.',
    elevation: 'View of the {name} from inside the room',
    patchLabel: '{name}, {left} along, {top} up. {hint}',
    reflectionHint:
      'The rings show where the first echo from each speaker lands. Those spots matter most: what is there?',
    patches: {
      title: 'Things on the {name}',
      intro:
        'Windows, shelves, curtains, paintings: anything that covers part of it. Drag them, or type exact values.',
      empty: 'Nothing added yet.',
      kind: {
        window: 'Window',
        shelf: 'Shelf or CD wall',
        curtain: 'Curtain',
        painting: 'Painting',
        rug: 'Rug',
        other: 'Other',
      },
      material: 'Material',
      label: 'Name (optional)',
      u: { fromFront: 'Distance from the front wall', fromLeft: 'Distance from the left wall' },
      v: { height: 'Height above the floor', fromFront: 'Distance from the front wall' },
      width: 'Width',
      height: 'Height',
      depth: 'Depth',
      remove: 'Remove',
    },
  },
  furnishing: {
    title: 'Furniture',
    intro:
      'Furniture changes how lively the room sounds, and things near the speakers can blur the sound. This step is optional.',
    needRoom: 'Enter the room size first.',
    busy: {
      legend: 'How full is the room?',
      help: 'A quick estimate is enough. Or place your furniture below for more detail.',
      combined:
        'Furniture you place below counts too: we use whichever of the two soaks up more sound.',
      bare: 'Bare',
      some: 'Some furniture',
      busy: 'Busy',
      veryBusy: 'Very busy',
    },
    objects: {
      title: 'Furniture and other things',
      intro: 'Add what is in the room, then drag it into place on the plan or type exact values.',
      empty: 'Nothing placed yet.',
    },
    affects: 'Affects',
    tag: { room: 'room sound', reflections: 'reflections', view: 'may block the view' },
    name: 'Name (optional)',
    fromLeft: 'From the left wall',
    fromFront: 'From the front wall',
    width: 'Width',
    depth: 'Depth',
    height: 'Height',
    material: {
      label: 'Material',
      hard: 'Hard (reflects sound)',
      soft: 'Soft (upholstery, books, fabric)',
      absorbent: 'Absorbent (thick porous material)',
    },
    rotate: 'Rotate 90°',
    remove: 'Remove',
  },
  speakers: {
    quick: {
      port: {
        label: 'Bass port',
        sealed: 'None (sealed)',
        front: 'At the front',
        rear: 'At the back',
      },
      more: 'More (optional)',
      dispersion: {
        label: 'How widely they spread sound',
        help: 'Not sure? Leave it on Typical. It is an estimate and only changes advice about listening distance, never the map.',
        narrow: 'Narrow',
        typical: 'Typical',
        wide: 'Wide',
      },
    },
    title: 'Speakers',
    intro: 'Pick the closest type and say where they stand. Everything else is optional.',
    type: {
      legend: 'Which speakers are closest to yours?',
      help: 'This fills in typical sizes. You can change them under More details.',
      'small-bookshelf-rear-port': {
        name: 'Small bookshelf speaker',
        short: 'Bookshelf',
        help: 'Two-way, port at the back',
      },
      'coaxial-active-monitor': {
        name: 'Coaxial active monitor',
        short: 'Coaxial monitor',
        help: 'Tweeter in the middle of the woofer',
      },
      'sealed-bookshelf': {
        name: 'Sealed bookshelf speaker',
        short: 'Sealed bookshelf',
        help: 'No port',
      },
      'floorstander-front-port': {
        name: 'Floor-standing, port at the front',
        short: 'Floor-standing',
        help: 'Tall, three-way',
      },
      'floorstander-rear-port': {
        name: 'Floor-standing, port at the back',
        short: 'Floor-standing',
        help: 'Tall, three-way',
      },
    },
    describe: { title: 'Your speaker' },
    more: { summary: 'More details', hint: 'Size, port, seat, toe-in, speaker file' },
    brand: 'Brand (for your own reference)',
    model: 'Model (for your own reference)',
    size: { width: 'Width', height: 'Height', depth: 'Depth' },
    port: {
      label: 'Where is the bass port?',
      help: 'The opening that lets bass out. Near a wall, a rear port matters more.',
      front: 'At the front',
      rear: 'At the back',
      down: 'At the bottom',
      side: 'At the side',
      none: 'There is no port',
      unknown: 'I don’t know',
    },
    enclosure: {
      label: 'What kind of box is it?',
      sealed: 'Sealed',
      ported: 'Ported (has a port)',
      'passive-radiator': 'Passive radiator',
      'open-baffle': 'Open baffle',
      unknown: 'I don’t know',
    },
    layout: {
      label: 'How are the drivers arranged?',
      help: 'Coaxial means the tweeter sits in the middle of the woofer.',
      coaxial: 'Coaxial (tweeter in the middle of the woofer)',
      'two-way': 'Two-way (tweeter and woofer)',
      'three-way': 'Three-way',
      'full-range': 'Full-range',
      other: 'Something else',
      unknown: 'I don’t know',
    },
    controls: {
      legend: 'Does it have…',
      treble: 'A treble control',
      bass: 'A bass control',
      wall: 'A wall or placement setting (distance from the wall)',
      minWall: 'A minimum distance from the wall given by the maker',
      minWallValue: 'Minimum distance from the wall',
    },
    advanced: {
      f6: 'Lowest note it plays well (Hz)',
      f6Help:
        'The frequency where the bass has dropped by 6 dB, from the specifications. Leave empty if you don’t know.',
    },
    file: {
      save: 'Save speaker file',
      load: 'Load speaker file',
      loaded: 'Speaker loaded from the file.',
      error: {
        notJson: 'This is not a readable speaker file.',
        tooBig: 'This file is too large to be a speaker file.',
        notAProfile: 'This file does not contain a speaker.',
        newerVersion: 'This speaker file was made with a newer version of the app.',
        invalid: 'This speaker file could not be read: {detail}',
      },
    },
    placement: {
      title: 'Where they stand',
      help: 'You can also drag them on the drawing.',
      seatTitle: 'Your seat and aim',
      certainty: 'How sure are you about these positions?',
      clearance: 'Back of the speakers to the front wall',
      spacing: 'Distance between the speakers',
      stand: 'Height of the speaker’s base (stand or desk)',
      seat: 'Seat to the front wall',
      ears: 'Height of your ears when seated',
      toeIn: 'Toe-in (degrees)',
      toeInHelp:
        'Turning the speakers towards you. 0 means they point straight ahead. Many speakers sound fine either way: try both.',
      mirror: 'Keep the speakers symmetric (moving one moves the other)',
    },
    limits: {
      title: 'What can move?',
      help: 'Real rooms have limits. Tell us what is fixed, and we will only suggest things you can do.',
      reach: 'How far into the room can the speakers come?',
      reachValue: 'Distance from the front wall',
      seat: {
        legend: 'Can your seat move?',
        free: 'Freely',
        range: 'Forward and back, within limits',
        fixed: 'No, it is fixed',
        from: 'Nearest to the front wall',
        to: 'Furthest from the front wall',
      },
      fixed: 'My speakers can’t move (only suggest a better seat)',
      zone: {
        legend: 'How far can the speakers move from where they are now?',
        help: 'Suggestions keep each speaker within this distance.',
        any: 'Anywhere',
      },
    },
  },
  goals: {
    title: 'What do you want from the sound?',
    intro:
      'Say what matters to you. Goals nudge the advice a little; the physics of the room always comes first.',
    goal: {
      'wide-stage': {
        name: 'Wide soundstage',
        help: 'Music that spreads out beyond the speakers.',
      },
      'precise-imaging': {
        name: 'Precise imaging',
        help: 'Instruments that stay in sharply defined places.',
      },
      'flat-response': {
        name: 'Flat, neutral sound',
        help: 'Nothing too boomy, bright or hollow.',
      },
      'deep-bass': {
        name: 'Deep bass',
        help: 'Reaching the lowest notes, even at the price of some uneven bass.',
      },
      'low-volume-listening': {
        name: 'I mostly listen quietly',
        help: 'Our ears hear less bass and treble at low volume.',
      },
    },
    level: { dontCare: 'Don’t care', nice: 'Nice to have', important: 'Important' },
    conflict:
      'Wide and precise pull in different directions. We’ll look for a balance and show you the trade-off.',
  },
  results: {
    calculating: 'Calculating…',
    needRoom: 'Tell us the room size and we will have a first answer for you.',
    yourSetup: 'Your setup',
    bestFound: 'Best we found',
    counts: 'Red flags: {red} · Cautions: {caution}',
    score: { poor: 'Poor', fair: 'Fair', good: 'Good', veryGood: 'Very good' },
  },
  plan: {
    label: 'Top view of the room',
    placeholder: 'Enter the room size and it appears here.',
    frontWall: 'Front wall (speakers)',
    seat: 'Seat',
    speaker: 'Speaker',
    summary:
      'Room {width} wide and {length} long. Speakers {spacing} apart. Seat {distance} from the speakers.',
    speakerLeft: 'Left speaker',
    speakerRight: 'Right speaker',
    speakers: 'Speakers',
    sideLabel: 'Side view of the room',
    view: { label: 'View', top: 'Top view', side: 'Side view' },
    item: {
      hint: 'Arrow keys move it by 1 cm, Shift and arrow keys by 10 cm.',
      hintSide:
        'Left and right arrows change the distance from the front wall, up and down change the height. Shift makes bigger steps.',
      speaker: '{name}. {front} from the front wall, {side} from the nearest side wall. {hint}',
      speakerSide: '{name}. {front} from the front wall, {height} above the floor. {hint}',
      seat: 'Seat. {front} from the front wall, ears {height} above the floor. {hint}',
      seatSide: 'Seat. {front} from the front wall, ears {height} above the floor. {hint}',
      object: '{name}. {hint}',
    },
  },
  variant: {
    tabs: 'Setups',
    current: 'Current',
    new: 'New setup',
    rename: 'Rename setup',
    renameLabel: 'Setup name',
    delete: 'Delete setup',
    deleteConfirm: 'Delete the setup “{name}”? This cannot be undone.',
  },
  object: {
    bed: 'Bed',
    sofa: 'Sofa',
    armchair: 'Armchair',
    table: 'Table',
    cabinet: 'Cabinet',
    shelf: 'Shelf',
    radiator: 'Radiator',
    'other-speaker': 'Other speaker',
    tv: 'TV',
    desk: 'Desk',
    wardrobe: 'Wardrobe',
    bookcase: 'Bookcase',
    piano: 'Piano',
    rack: 'Equipment rack',
    plant: 'Large plant',
    fireplace: 'Fireplace',
    lamp: 'Standing lamp',
    subwoofer: 'Subwoofer',
    custom: 'Other object',
  },
  dock: {
    label: 'Sections',
    room: 'Room',
    surfaces: 'Surfaces',
    furnishing: 'Furniture',
    speakers: 'Speakers',
    goals: 'Goals',
    side: 'Side view',
  },
  settings: {
    label: 'Settings',
  },
  nav: {
    room: 'Your room',
    results: 'Results',
    why: 'Why this result',
    treat: 'Improve the room',
    listen: 'Listening notes',
    bass: 'Bass at your seat',
    placement: 'What to work out',
    back: 'Back',
    notSet: 'Not set',
    progress: '{n} of {total} set',
    status: { done: 'set', partial: 'partly set', todo: 'not set yet' },
    none: 'None',
  },
  survey: {
    start: 'Start',
    welcome: {
      title: 'Where should your speakers go?',
      body: 'Answer a few quick questions about your room, and we show you where to put your speakers and where to sit, before anything else.',
      free: 'Free, with no sign-up and no email.',
      private: 'Your room stays on this device.',
      short: 'Four short questions, about a minute.',
    },
    step: '{n} of {total}',
    skip: 'Skip',
    back: 'Back',
    next: 'Next',
    done: 'Show me',
    room: {
      title: 'How big is your room?',
      help: 'Rough numbers are fine. Leave the ceiling empty and we assume a typical {height}.',
    },
    goal: {
      title: 'What do you want to work out?',
      help: 'You can change this any time.',
      speakers: { name: 'Where to put my speakers', help: 'My seat stays where it is.' },
      seat: { name: 'Where to sit', help: 'My speakers stay where they are.' },
      both: { name: 'Both', help: 'I can move the speakers and my seat.' },
    },
    speaker: {
      title: 'Which speakers are closest to yours?',
      help: 'Pick the nearest match. It fills in typical sizes.',
    },
    where: {
      title: 'Where are things now?',
      help: 'Rough is fine. You can drag everything on the map later.',
      both: 'Nothing to measure: we look for the best spot for both.',
    },
  },
  suggest: {
    title: 'Best placement',
    move: {
      label: 'Find the best place for',
      both: 'Both',
      speakers: 'Speakers',
      seat: 'Seat',
    },
    place: {
      label: 'Where you listen',
      chair: 'Chair',
      sofa: 'Sofa',
      desk: 'Desk',
      bed: 'Bed',
    },
    speakers: 'Speakers',
    bass: 'Bass at that seat',
    bassWord: {
      even: 'Even',
      fair: 'Fairly even, weakest near {frequency}',
      uneven: 'Uneven near {frequency}',
    },
    optionsTitle: 'Options',
    speakersLine: '{front} from the front wall (back panel), {spacing} apart',
    seat: 'Your seat',
    seatLine: '{front} from the front wall, {distance} from each speaker',
    stay: 'Stay where they are',
    seatStays: 'Stays where it is',
    mood: 'Your setup now: {word}',
    say: {
      speakers: 'Move the speakers {parts}.',
      away: '{d} further from the front wall',
      toward: '{d} closer to the front wall',
      apart: '{d} further apart',
      together: '{d} closer together',
      and: ' and ',
      seatBack: 'Move your seat {d} back.',
      seatForward: 'Move your seat {d} forward.',
      keep: 'Keep everything where it is.',
    },
    verdict: 'Your setup now: {now}. With this placement: {best}.',
    apply: 'Apply',
    applied: 'Placement applied.',
    already: 'Your setup is already about as good as it gets in this room.',
    others: 'Other good options',
    option: 'Option {letter}: {score}',
    closer:
      'The room is too small to sit 1.5 m from the speakers, so this is the best closer spot.',
    nothing: 'No placement fits your limits. Let more things move.',
    zoneCost: 'Within {zone}: {inside}. With more room: {outside}.',
  },
  result: {
    title: 'Your result',
    brief: {
      fixed: '{now} as it is.',
      top: '{now}. Moving things here would not make a real difference.',
      better: '{now} now. The placement below makes it {best}.',
      same: '{now} now. The placement below fine-tunes it.',
    },
    idea: 'Also worth trying',
    area: {
      even: {
        sofa: 'About the same for everyone on the sofa.',
        desk: 'About the same as you move at the desk.',
        bed: 'About the same across the bed.',
      },
      uneven: 'In the middle: {centre}. {where}: {worst}.',
      where: {
        left: 'At the left end',
        right: 'At the right end',
        front: 'At the front',
        back: 'At the back',
        ends: 'At both ends',
      },
    },
  },
  panel: {
    label: 'Settings and results',
    close: 'Back to the results',
    done: 'Done',
  },
  map: {
    dimmed: 'Advised against',
    bestHere: 'Best here: {word}',
    absolute: 'Absolute scale',
    hidePanel: 'Hide the side panel',
    best: 'Best',
    now: 'Now: {word}',
    before: 'Before',
    showPanel: 'Show the side panel',
    notListening: 'Not a listening position',
    noSpeakers: 'The speakers can’t go here',
    label: 'Map',
    hint: 'Drag anything. The map redraws as you move. Click a number to type an exact value.',
    layerLabel: 'Map layer',
    pick: { speakers: 'Speakers', seat: 'Seat' },
    why: 'Why?',
    whyLabel: 'What makes a seat good or poor',
    poorer: 'Poorer',
    better: 'Better',
    flagged: 'Hatched: the guidelines advise against sitting here.',
    caption: 'Where your seat could go ({where}).',
    whereNow: 'speakers where they are now',
    wherePreview: 'speakers at spot {letter}',
    pin: 'Best spot {letter}. Score {score}.',
    dimEdit: 'Type an exact value for {name}',
    dim: {
      clearance: 'Back of speaker to front wall',
      spacing: 'Between the speakers',
      side: 'Speaker to side wall',
      seat: 'Seat to front wall',
      width: 'Room width',
      length: 'Room length',
    },
  },
  layer: {
    speakers: {
      name: 'Where the speakers go',
      what: 'Where the speakers would sound best, with your seat staying where it is. Each spot is where the speaker pair would stand, mirrored about your seat. Brighter is better.',
    },
    overall: {
      name: 'Overall',
      what: 'How good a seat is here, everything counted equally. Brighter is better.',
    },
    goals: {
      name: 'My goals',
      what: 'The same, weighted by the goals you chose.',
    },
    bass: {
      name: 'Bass evenness',
      what: 'How even the bass is at this seat. Dark means boomy or thin bass.',
    },
    nulls: {
      name: 'Bass holes',
      what: 'Whether a bass note nearly vanishes here. Dark means a deep hole.',
    },
    frontWall: {
      name: 'Wall interference',
      what: 'The dip caused by the wall behind the speakers, as heard here.',
    },
    stereo: {
      name: 'Stereo',
      what: 'How good the angle and the distances to the two speakers are.',
    },
    symmetry: {
      name: 'Symmetry',
      what: 'Whether both sides of the room treat the sound alike.',
    },
    backWall: {
      name: 'Back wall',
      what: 'Dark means too close to the back wall.',
    },
  },
  evidence: {
    physics: 'Physics',
    guideline: 'Guideline',
    heuristic: 'Rule of thumb',
    subjective: 'By ear',
  },
  severity: {
    'red-flag': 'Red flag',
    caution: 'Caution',
    info: 'Note',
    ok: 'Fine',
  },
  concern: {
    bass: 'Bass',
    frontWall: 'Wall behind the speakers',
    reflections: 'Reflections',
    stereo: 'Stereo picture',
    room: 'The room',
    speaker: 'Your speaker',
    objects: 'Things in the way',
    rulesOfThumb: 'Rules of thumb',
  },
  why: {
    title: 'Why',
    setup: 'Your setup',
    best: 'Best found',
    tryIt: 'Try spot {letter}',
    applied: 'Spot {letter} applied. Undo brings your setup back.',
    spotDetails:
      'Speakers {front} from the front wall and {spacing} apart. Seat {seat} from the front wall.',
    preview: 'Showing spot {letter} on the map and in the chart.',
    stopPreview: 'Back to your setup',
    spotsTitle: 'Best spots',
    compromise:
      'No spot within your limits avoids every serious problem, so these are the least bad. Their red flags are listed below; loosening a limit (what can move) may help.',
    allFixed:
      'You marked both the seat and the speakers as fixed, so there is nothing to move. The findings below and the Treat tab still apply.',
    spotLabel: 'Spot {letter}',
    moveFirst: 'Moving to the best spot would help most.',
    alreadyGood: 'Your setup is already close to the best we found.',
    fragile: {
      steady: 'Holds up well if things are a few centimetres off.',
      sensitive: 'Sensitive: small errors in placement or room size change the result a little.',
      fragile: 'Fragile: this only works if everything is exactly as entered.',
    },
    fragileShort: { steady: 'steady', sensitive: 'sensitive', fragile: 'fragile' },
    problems: 'What to look at',
    noProblems: 'Nothing to worry about with this setup.',
    notes: 'Notes',
    showNotes: 'Show notes ({count})',
    hideNotes: 'Hide notes',
    folk: 'Rules of thumb',
    confidence: 'How sure are we?',
    confidenceHint:
      'The more you tell us about the room, the better the advice. Next best: {next}.',
    disclaimer: 'Guidance, not a guarantee. Your ears have the final say.',
  },
  next: {
    surfaces: 'choose the wall materials',
    furnishing: 'say how full the room is',
    room: {
      width: 'measure the room width',
      length: 'measure the room length',
      height: 'measure the ceiling height',
      construction: 'say what the walls are made of',
    },
    speakers: {
      position: 'measure where the speakers are',
    },
    listener: {
      position: 'measure where you sit',
    },
    speaker: {
      lowFrequencyMinus6dB: 'enter the speaker’s lowest note',
      directivity: 'describe the speaker’s spread',
      portLocation: 'say where the speaker’s port is',
      enclosure: 'say what kind of cabinet the speaker has',
      acousticAxisHeight: 'measure the tweeter height',
      driverLayout: 'say how the speaker’s drivers are arranged',
    },
  },
  folkRule: {
    H01: 'The popular 38% rule',
    H02: 'The rule of thirds',
    asGood:
      '{rule} would put your seat at {seatY}. The map agrees: that spot is about as good as the best one in this row.',
    close:
      '{rule} would put your seat at {seatY}. The map says it is close, but {bestY} is a little better.',
    worse:
      '{rule} would put your seat at {seatY}. In this room the map says {bestY} is clearly better.',
    notAllowed:
      '{rule} would put your seat at {seatY}, but a seat cannot go there (too close to a speaker, or something is in the way).',
    flag: ' The guidelines advise against that exact spot.',
  },
  probe: {
    title: 'Seat here · {front} from the front wall',
    moveHere: 'Move my seat here',
    speakersTitle: 'Speakers here',
    speakersHere: 'Speakers here: {word}',
    speakersNot: 'The speakers cannot stand here.',
    speakersFlagged:
      'Advised against: not a good stereo setup, or on furniture. The score is the bass only where the seat is not in front of the speakers.',
    moveSpeakers: 'Move the speakers here',
    close: 'Close',
    notAllowed: 'The seat cannot go here: too close to a speaker, or something is in the way.',
    flagged: 'The guidelines advise against sitting here.',
    allFine: 'Nothing stands out here.',
    weakest: 'Weakest point: {layer}.',
    score: 'Score: {word}',
  },
  chart: {
    title: 'Bass at your seat',
    sub: 'predicted shape, not loudness',
    now: 'Your seat',
    spot: 'Spot {letter}',
    modes: 'Room resonances',
    band: 'Judged range',
    desc: 'Predicted bass between {from} and {to}: strongest near {peak}, weakest near {dip}.',
    noData: 'Enter the room size to see the predicted bass.',
  },
  words: {
    gain: {
      high: 'high',
      'very-high': 'very high',
    },
    zone: {
      near: 'That counts as close to the wall.',
      away: 'That counts as away from the wall.',
    },
    speaker: {
      both: 'Both speakers',
      left: 'Left speaker',
      right: 'Right speaker',
    },
    speakerFrom: { left: 'the left speaker', right: 'the right speaker' },
    closer: {
      left: 'the left one',
      right: 'the right one',
    },
    wall: {
      left: 'left wall',
      right: 'right wall',
      front: 'front wall',
      back: 'back wall',
      floor: 'floor',
      ceiling: 'ceiling',
    },
    boundary: {
      front: 'front wall',
      side: 'side wall',
      floor: 'floor',
      ceiling: 'ceiling',
    },
    direction: {
      above: 'above',
      below: 'below',
    },
    source: {
      manufacturer: 'the manufacturer’s minimum',
      default: 'a typical minimum',
    },
  },
  finding: {
    P02: {
      lowestModes:
        'The room’s lowest bass notes are about {length} (along the length), {width} (across) and {height} (up and down).',
    },
    P04: {
      frontWall:
        '{speaker}: the woofer is {distance} from the front wall, so some bass cancels near {frequency}.',
      aligned:
        '{speaker}: the woofer is about the same distance from two surfaces ({boundaryA}, {boundaryB}), so their bass dips line up near {frequency}.',
    },
    P05: {
      low: 'Nearby walls add little extra bass to the speakers.',
      moderate: 'Nearby walls add some bass to the speakers (below about {belowHz}).',
      high: 'Nearby walls add a lot of bass (below about {belowHz}). It may sound heavy.',
      'very-high':
        'The speakers are in or next to a corner: the bass gets a big, uneven boost below about {belowHz}.',
    },
    P06: {
      sideWall:
        '{speaker}: the first reflection ({boundary}) reaches you {delayMs} after the direct sound. That surface ({surface}) {surfaceClass}.',
      floor:
        '{speaker}: the floor reflection reaches you {delayMs} after the direct sound. The floor ({surface}) {surfaceClass}.',
      ceiling:
        '{speaker}: the ceiling reflection reaches you {delayMs} after the direct sound. The ceiling ({surface}) {surfaceClass}.',
      scattering:
        '{speaker}: the reflection point ({boundary}) is on a surface that scatters sound ({surface}), so a plain reflection is not predicted there.',
    },
    P07: {
      transition:
        'Below about {frequency} the room’s resonances rule; above it the sound blends more evenly (somewhere between {low} and {high}).',
    },
    P08: {
      dead: 'The room is on the dead side: reverberation about {t60} (between {low} and {high}). Sound is close and dry.',
      balanced:
        'The room is in the usual range: reverberation about {t60} (between {low} and {high}).',
      live: 'The room is on the lively side: reverberation about {t60} (between {low} and {high}). Soft furnishings or curtains would calm it.',
    },
    P09: {
      peak: 'The bass is predicted to boom near {frequency} at this seat, about {db} louder than the rest.',
      dip: 'The bass is predicted to nearly vanish near {frequency} at this seat, about {db} quieter than the rest.',
      smooth: 'The predicted bass is even at this seat: no peak or dip over 6 dB.',
      notScored:
        'This speaker only plays down to about {lowFrequencyMinus6dB}, too high to judge the room’s bass resonances, so we do not.',
    },
    P10: {
      ratio:
        'Direct sound and room sound are equal {criticalDistance} from a speaker. You sit {listeningDistance} away, {ratio} times that.',
    },
    P11: {
      coincident:
        'Several of the room’s lowest bass resonances sit close together (for example {frequencyA} and {frequencyB}), so those notes may boom.',
      bonello:
        'The room’s resonances thin out above about {band}, so the bass may sound uneven there.',
      ituPass: 'The room’s proportions meet the ITU-R recommendation for listening rooms.',
      ituFail:
        'The room’s proportions fall outside the ITU-R listening-room recommendation. You cannot change that; it just explains why some rooms are harder.',
    },
    G01: {
      redFlag:
        'The seat is almost exactly in the middle of the room’s length, where the lowest bass note nearly vanishes. Move it forward or back by about a tenth of the room length.',
      caution:
        'The seat is close to the middle of the room’s length ({offsetFraction} of the length away), where some bass is weaker.',
      ok: 'The seat is a good distance from the middle of the room’s length.',
      widthNode:
        'You sit on the centre line, which is also where some side-to-side bass resonances are weak. That is a normal trade-off for a symmetric stereo setup.',
    },
    G02: {
      redFlag:
        'Your head is only {distance} from the back wall: bass is heavy there and the wall’s reflection arrives almost at once. Move the seat forward.',
      caution:
        'Your head is {distance} from the back wall: bass gets heavier and the reflection is early. Sit further forward if you can.',
      ok: 'The seat has room behind it ({distance} to the back wall).',
    },
    G03: {
      redFlag:
        'The speakers are very different distances from their side walls (they differ by {difference}), so the stereo image leans to one side.',
      caution:
        'The speakers’ side-wall distances differ by {difference}, so the image may lean a little.',
      ok: 'Both speakers are the same distance from their side walls.',
      surfaces:
        'The left wall {left} but the right wall {right}, so the two channels sound slightly different.',
    },
    G04: {
      redFlag:
        'You and the two speakers form a {angle} angle. Stereo works best near 60°: this is too narrow or too wide.',
      caution: 'The angle between the speakers is {angle}, a bit off the ideal 60°.',
      info: 'The angle between the speakers is {angle}, near the ideal 60°.',
      ok: 'The angle between the speakers is {angle}: close to the ideal 60°.',
    },
    G05: {
      redFlag:
        'One speaker is {difference} nearer to you than the other (the nearer is {closer}), so the image pulls toward it.',
      caution: 'One speaker is {difference} nearer to you than the other (the nearer is {closer}).',
      ok: 'Both speakers are the same distance from your ears.',
    },
    G06: {
      redFlag:
        '{speaker} sits in a corner, where it excites every bass resonance at full strength. Pull it out.',
      caution: '{speaker} is close to a corner: expect extra, uneven bass.',
      ok: 'Neither speaker is near a corner.',
    },
    G07: {
      tooClose:
        'The speaker’s rear port is {clearance} from the wall; it needs at least {minimum} ({source}).',
      ok: 'The rear port has enough room ({clearance}; the minimum is {minimum}).',
      unknownPort:
        'We do not know where this speaker’s port is. If it is at the back, keep it away from the wall.',
      matchSetting:
        'Your speaker has a wall-distance setting: set it for the {clearance} between its back and the wall.',
    },
    G08: {
      redFlag:
        'Your ears are {angle} {direction} the speakers’ axis, which is too steep: the sound changes. Raise or lower the speakers, or tilt them.',
      caution:
        'Your ears are {angle} {direction} the speakers’ axis. A little more level would sound better.',
      ok: 'The speakers point at about ear height.',
    },
    G09: {
      treatForImaging:
        'The {boundary} ({surface}) reflects sound to your seat. For a sharper image, treat that spot.',
      keepForWidth:
        'The {boundary} ({surface}) reflects sound to your seat, which adds width. Leave it as it is.',
      bothSchools:
        'The {boundary} ({surface}) reflects sound to your seat. Some people treat that spot for a sharper image, others keep it for width: try both.',
    },
    G10: {
      obstruction: 'A {object} is between a speaker and your ears and blocks the sound. Move it.',
      nearbyHard:
        'A hard object ({object}) is {distance} from {speakerFrom} and adds reflections that blur the sound.',
      passiveSpeaker:
        'Another speaker ({object}) is {distance} from {speakerFrom}. It can resonate along: try covering or moving it, and listen.',
    },
    H01: {
      overlay:
        'A popular rule of thumb puts the seat 38% into the room: {listenerY} here. Where it comes from is unclear.',
    },
    H02: {
      overlay:
        'The rule of thirds puts the speakers {speakersY} from the front wall and the seat {listenerY}. It is a folk rule.',
    },
    H04: {
      near: 'The woofer is close to the front wall ({distance}): its bass dip is up at {frequency}, mostly out of the way.',
      middle:
        'The woofer is {distance} from the front wall: its bass dip falls at {frequency}, where it is most audible. Closer, or much further, is usually better.',
      far: 'The woofer is far from the front wall ({distance}): the bass dip is low, at {frequency}, and narrow.',
    },
    H05: {
      experiment:
        'Toe-in is {toeInLeft}°. Without measurements we cannot say what is best: try a few degrees of toe-in and none, and listen.',
    },
    H06: {
      lift: 'The room’s high frequencies die away quickly ({t60}). A small treble lift ({suggestDb}) may help: try it and listen.',
      cut: 'The room’s high frequencies ring on ({t60}). A small treble cut ({suggestDb}) may help: try it and listen.',
    },
  },
  tabs: {
    label: 'Panel',
    why: 'Why',
    treat: 'Treat',
    listen: 'Listen',
  },
  listen: {
    title: 'Listen and note',
    intro:
      'Your ears are the final test. Change one thing, listen, and write down what you hear. Notes never change what the app calculates.',
    protocolTitle: 'How to test a change',
    protocol: {
      one: 'Change one thing only, for example move the seat 10 cm.',
      two: 'Play the same three tracks each time: a centred voice, a bass-heavy track and a wide orchestral or ambient recording.',
      three: 'Keep the volume the same, then rate it.',
    },
    adapt: 'Ears adapt over hours. Judge after some time, and compare at the same volume.',
    formTitle: 'A note for “{setup}”',
    rating: {
      legend: 'How did this setup sound?',
      scale: '1 = poor, 5 = great',
      value: '{n} of 5',
    },
    symptoms: 'What do you hear? (optional)',
    duration: {
      legend: 'How long have you listened to this setup?',
      short: 'Under an hour',
      hours: 'A few hours',
      days: 'Days',
    },
    text: 'Your note (optional)',
    save: 'Save note',
    listTitle: 'Notes for “{setup}”',
    empty: 'No notes for this setup yet.',
    delete: 'Delete note',
    tryThis: 'Try this',
    earlier:
      'Rated before the setup last changed, so it no longer counts in the comparison with the app.',
    symptom: {
      S01: {
        name: 'Boomy, heavy bass',
        try: 'Move your seat about 20 cm forward, or the speakers about 10 cm further from the wall. If your speakers have a wall-compensation setting, turn it on.',
      },
      S02: {
        name: 'Thin, weak bass',
        try: 'Move your seat 15 cm to either side, or forward or back. If your speakers have a front-wall option, try the “near” and “far” settings.',
      },
      S03: {
        name: 'Vague centre, lacks focus',
        try: 'Measure the distance from each speaker to your seat with a tape and make them equal. Try turning the speakers in towards you.',
      },
      S04: {
        name: 'Narrow soundstage',
        try: 'Move each speaker about 10 cm further apart, and turn them in a little less.',
      },
      S05: {
        name: 'Harsh, bright treble',
        try: 'Turn the speakers in a little less, soften one reflection point with a rug or curtain, or lower the treble by 0.5 dB if you can.',
      },
      S06: {
        name: 'Dull, closed-in',
        try: 'Check that the tweeters are at ear height, remove anything between the speakers and your seat, or raise the treble by 0.5 dB if you can.',
      },
      S07: {
        name: 'Sound pulls to one side',
        try: 'Check the balance control first. Then swap the left and right cables at the amplifier: if the pull moves to the other side, the cause is before the speakers (source, amplifier, cable). If it stays, swap the two speakers: if the pull moves with a speaker, it is that speaker; if it stays, it is the room.',
      },
    },
    agreement: {
      title: 'Your ears and the app',
      notEnough:
        'Rate at least two different setups, and the app will tell you whether your ears and its ranking agree.',
      agree:
        'So far your ratings agree with the app’s ranking: the setups you liked more are the ones it scores higher.',
      mixed:
        'Your ratings agree with the app’s ranking for some pairs of setups and not for others. A few more notes will show a pattern.',
      disagree:
        'You liked “{ears}” best, but the app scores “{app}” higher. The app uses a simplified model, so trust your ears here. It may mean that something in the room differs from what you entered (surfaces, furniture, speaker details), so it is worth checking those.',
    },
  },
  compare: {
    title: 'Compare setups',
    with: 'Compare with',
    none: 'None',
    same: 'Both setups score about the same.',
    higher: '“{name}” scores higher.',
    legend: 'Setup “{name}”',
    chartNote:
      'On the “Bass at your seat” page, the other setup is the dashed line, each at its own seat.',
  },
  print: {
    now: 'Your setup now: “{setup}”',
    best: 'Best spot we found (A)',
    room: 'Room {width} wide, {length} long, {height} high',
    frontWall: 'Front wall',
    wall: { left: 'left', right: 'right' },
    speaker:
      '{side}: rear panel {front} from the front wall, centre {sideWall} from the {wall} wall, stand height {height}, toe-in {toeIn}°.',
    seat: 'Seat: {front} from the front wall, {left} from the left wall, ears at {ears}.',
    between:
      'Speakers {between} apart, centre to centre. To your seat: {left} (left) and {right} (right), along the floor.',
    footer:
      'These are predictions, not measurements. Move one thing at a time and trust your ears.',
  },
  treat: {
    title: 'Treat the room',
    intro:
      'What would help most, in order. Sizes are rough guides, not promises: change one thing, then listen.',
    first: 'If you can only do one thing',
    roomTitle: 'Room treatment',
    settingsTitle: 'Speaker settings',
    none: 'Nothing to suggest for this setup.',
    noSettings: 'Nothing to change on the speaker for this setup.',
    onMap: 'Marked on the map ({n}).',
    effect: {
      small: 'Small effect',
      moderate: 'Moderate effect',
      large: 'Large effect',
    },
  },
  mode: {
    chip: 'Bass note',
    name: 'Bass note',
    what: 'Where one bass note is loud or silent in your room, with the speakers as they are. Bright is loud, dark is quiet.',
    frequency: 'Frequency',
    poorer: 'Quiet',
    better: 'Loud',
    near: 'Room resonances near this note: {modes}.',
    nearNone: 'No room resonance near this note: the pattern comes from many weak ones.',
    lowest: 'Lowest resonances',
    axial: 'along the length',
    axialW: 'across the width',
    axialH: 'up and down',
    tangential: 'two pairs of walls',
    oblique: 'all three wall pairs',
    jump: 'Jump to {frequency}',
    aboveTransition:
      'Above about {frequency} the room’s resonances overlap, so the real pattern differs more from this picture.',
    caption: 'Bass note at {frequency}: where it is loud or silent (speakers as they are).',
  },
  advice: {
    T01: {
      absorb:
        '{speaker}: at the marked spot ({boundary}) its first reflection lands. A porous panel about {thickness} thick, or a diffuser, there sharpens the image.',
      experiment:
        '{speaker}: its first reflection lands on a hard surface at the marked spot ({boundary}). Experts disagree about treating it, so try a panel or diffuser there (about {thickness} thick), listen, and keep what you like.',
    },
    T02: {
      rug: 'A thick rug on the floor between the speakers and you, at the marked spot, softens the floor reflection, mainly in the treble (a rug does little for bass). It is cheap: try it.',
      ceilingPanel:
        'A panel on the ceiling at the marked spot would cut its reflection. This matters less than the side walls, so it comes later.',
    },
    T03: {
      moveFirst:
        'The wall behind the speakers cancels bass near {frequency} at your seat. A panel would have to be about {quarterWavelength} deep to cure it, which is rarely practical: moving the speakers (see the best spots) works better.',
      thickPanel:
        'The wall behind the speakers cancels bass near {frequency} at your seat. A thick absorber (10 to 20 cm) behind them makes the dip a little shallower, but cannot remove it: that would take a depth of about {quarterWavelength}.',
    },
    T04: {
      corners:
        'Bass traps in the corners help with the boom near {frequency}. Be realistic: below 100 Hz they must be large and deep, and small foam wedges do very little.',
    },
    T05: {
      soften:
        'The room is lively (reverberation about {t60}). About {absorption} of extra soft absorption, such as a large rug and heavy curtains, would bring it to about {after}.',
      liven:
        'The room is on the dead side (reverberation about {t60}). Taking away about {absorption} of soft absorption, with fewer rugs or curtains, would give about {after}.',
    },
    T06: {
      moveFirst:
        'Your head is {distance} from the back wall. Move the seat forward if you can: it helps more than any treatment.',
      absorber:
        'Your head is {distance} from the back wall and the seat cannot move. Put a thick absorber (at least {thickness}) behind your head.',
    },
    D01: {
      match:
        'Set the speaker’s wall-distance setting for the {clearance} between its back and the wall. {zone}',
    },
    D02: {
      cut: 'The speakers are close to walls, so the bass is boosted (boundary gain: {gain}). Try one step of bass cut on the speaker ({stepDb}) and listen.',
    },
    D03: {
      lift: 'The room soaks up high frequencies (reverberation {t60}). Try one step of treble lift ({stepDb}) and listen.',
      cut: 'The room lets high frequencies ring (reverberation {t60}). Try one step of treble cut ({stepDb}) and listen.',
    },
    D04: {
      height:
        'Your ears are {angle} off the speakers’ axis. Put the speakers’ bases about {baseHeight} above the floor (a stand or desk) so the tweeters are at ear height, or tilt the speakers.',
      tilt: 'Your ears are {angle} below the speakers’ axis, even with the speakers on the floor. Tilt them slightly down towards you, or sit a little higher.',
    },
    D05: {
      moveOut:
        'The rear port is {clearance} from the wall but needs {minimum}. Move the speakers out. The manual may say whether port plugs help.',
      fixed:
        'The rear port is {clearance} from the wall but needs {minimum}, and the speakers cannot move. Check the manual for port plugs or a setting for placement near a wall.',
    },
    D06: {
      desk: 'Your speaker has a desk mode and the speakers stand on a desk: switch it on.',
      stand: 'Use the speaker’s stand mode: the speakers are not on a desk.',
    },
    D07: {
      bassCut:
        'The speakers stand close to walls, which boosts the bass (boundary gain: {gain}). If your speakers or amplifier have a bass control, try a small step down, then listen.',
      trebleLift:
        'The room soaks up high frequencies (reverberation {t60}). If your speakers or amplifier have a treble control, try a small lift ({suggestDb}), then listen.',
      trebleCut:
        'The room lets high frequencies ring (reverberation {t60}). If your speakers or amplifier have a treble control, try a small cut ({suggestDb}), then listen.',
    },
  },
  analysis: {
    updating: 'Updating…',
    updatingLarge: 'Updating… a room this large takes a few seconds.',
    error: 'Something went wrong calculating this. Your data is safe.',
    copyDetails: 'Copy details',
  },
  crash: {
    title: 'This project cannot be shown',
    body: 'Something in it confused the app. Your other projects are safe. Save this one as a file if you want to keep it, then start a new project.',
    export: 'Export file',
    newProject: 'Start a new project',
    details: 'Technical details',
  },
  sheet: {
    expand: 'Show more',
    collapse: 'Show less',
  },
  about: {
    title: 'About',
    body: 'This app uses established room acoustics to suggest speaker and seat positions, and tells you how sure it is. It is guidance, not a guarantee.',
    sources: 'Every rule and its sources are documented in the project’s rule catalogue.',
  },
} as const;
