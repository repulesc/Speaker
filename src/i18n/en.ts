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
    label: 'Menu',
    undo: 'Undo',
    redo: 'Redo',
    share: 'Share link',
    export: 'Export file',
    import: 'Import file',
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
    'room.width': 'room width',
    'room.length': 'room length',
    'room.height': 'ceiling height',
    'room.construction': 'wall construction',
    'speakers.position': 'speaker positions',
    'listener.position': 'seat position',
    surfaces: 'wall surfaces',
    furnishing: 'furnishing',
    'speaker.lowFrequencyMinus6dB': 'speaker bass extension',
    'speaker.directivity': 'speaker dispersion',
    'speaker.portLocation': 'bass port location',
    'speaker.enclosure': 'speaker enclosure type',
    'speaker.acousticAxisHeight': 'tweeter height',
    'speaker.driverLayout': 'driver layout',
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
      'What the walls, floor and ceiling are made of changes how the room sounds. Guesses are fine; this step is optional.',
    pick: 'Which surface?',
    base: 'What is the {name} made of?',
    dontKnow: 'I don’t know',
    dontKnowHelp: 'We’ll assume {material}.',
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
    title: 'Furnishing',
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
    hard: 'Hard surface (reflects sound)',
    rotate: 'Rotate 90°',
    remove: 'Remove',
  },
  speakers: {
    title: 'Speakers',
    intro:
      'Describe your speakers and where they and your seat are. Rough values are fine; say so when you are unsure.',
    type: {
      legend: 'Start from a type',
      help: 'Pick the closest match. It fills in typical values, which you can change below.',
      'small-bookshelf-rear-port': {
        name: 'Small bookshelf speaker',
        help: 'Two-way, port at the back',
      },
      'coaxial-active-monitor': {
        name: 'Coaxial active monitor',
        help: 'Tweeter in the middle of the woofer',
      },
      'sealed-bookshelf': { name: 'Sealed bookshelf speaker', help: 'No port' },
      'floorstander-front-port': {
        name: 'Floor-standing, port at the front',
        help: 'Tall, three-way',
      },
      'floorstander-rear-port': {
        name: 'Floor-standing, port at the back',
        help: 'Tall, three-way',
      },
    },
    describe: { title: 'Your speaker' },
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
      summary: 'Advanced: bass extension',
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
      title: 'Where everything is',
      help: 'You can also drag the speakers and your seat on the drawing. Distances are measured from the front wall unless stated otherwise.',
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
  panel: {
    close: 'Back to the results',
    done: 'Show the results',
  },
  map: {
    label: 'Map',
    hint: 'Drag anything. The map redraws as you move. Click a number to type an exact value.',
    layerLabel: 'Map layer',
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
  analysis: {
    updating: 'Updating…',
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
