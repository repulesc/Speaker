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
  numbers: {
    label: 'Show the numbers',
    off: 'Off',
    on: 'On',
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
    switcher: 'Rooms on this device',
    current: 'Current project',
    new: 'New project',
    duplicate: 'Duplicate',
    rename: 'Rename',
    renameLabel: 'Project name',
    renameHint: 'Click to rename',
    renameButton: 'Rename “{name}”',
    delete: 'Delete',
    deleteConfirm: 'Delete “{name}”? This cannot be undone.',
    saved: 'Saved on this device',
    unsaved: 'Saving…',
    unavailable: 'Not saved: your browser blocks storage. Share a link to keep your work.',
    failed: 'Could not save: storage may be full. Share a link to keep your work.',
  },
  menu: {
    legacy: 'Previous versions',
    image: 'Share as image',
    label: 'Menu',
    support: 'Support Nodo ☕',
    undo: 'Undo',
    redo: 'Redo',
    share: 'Share link',
    print: 'Print sheet',
    startOver: 'Start over',
    startOverConfirm: 'Start over with an empty room? This room will be deleted.',
    about: 'About and sources',
  },
  share: {
    title: 'Share this setup',
    privacy:
      'The whole setup is stored inside the link itself. Nothing is sent to a server, and anyone with the link can open a copy.',
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
  steps: {
    label: 'Steps',
    setup: 'Room & speakers',
    place: 'Placement',
    listen: 'Listening check',
  },
  setup: {
    room: {
      title: 'Room',
      measured: 'I measured these with a tape',
      walls: 'Walls',
      floor: 'Floor',
      ceiling: 'Ceiling',
      assume: 'Not sure (we assume {material})',
      busy: 'How full is it?',
      busyLevel: { bare: 'Bare', some: 'Some furniture', busy: 'Busy', veryBusy: 'Very busy' },
      shape: {
        'open-plan-connection': 'Open to another room',
        'non-rectangular': 'Not a plain rectangle (L-shape, sloped ceiling)',
        help: 'The model assumes a closed rectangular box: either of these makes its bass less certain.',
      },
    },
    speakers: {
      title: 'Speakers',
      manual: 'From the manual',
      manualHint: 'Drivers, exact size, lowest note, controls',
      width: 'Width',
      height: 'Height',
      depth: 'Depth',
      f6: 'Lowest note (−6 dB), in Hz',
      controls: 'It has',
      treble: 'A treble control',
      bass: 'A bass control',
      wall: 'A wall or placement setting',
      minWall: 'A minimum wall distance from the maker',
      minWallValue: 'Minimum distance from the wall',
    },
    listen: {
      title: 'Listening position',
      place: 'Where you listen',
      zone: 'The speakers may move',
      anywhere: 'Anywhere',
      goals: 'What matters most to you',
      exact: 'Exact positions',
      exactHint: 'If you measured them; or drag them on the plan',
      clearance: 'Speakers to the front wall',
      spacing: 'Between the speakers',
      seat: 'Seat to the front wall',
      ears: 'Ear height, seated',
      stand: 'Speaker base height',
      toeIn: 'Toe-in (°)',
      mirror: 'Keep the pair symmetric',
    },
    notSure: 'Not sure',
    next: 'See where they go',
  },
  place: {
    details: 'The details',
    detailsHint: 'Why, the reasons on the map, the bass at your seat',
  },

  field: {
    unusual: 'Is that right? Rooms are usually between {min} and {max}.',
    outOfRange: '{label} must be between {min} and {max}.',
  },
  room: {
    width: 'Width',
    length: 'Length',
    height: 'Ceiling height',
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
  speakers: {
    ask: {
      kind: {
        label: 'What kind of speakers?',
        bookshelf: 'Bookshelf or stand speakers',
        floorstander: 'Floor-standing (tower)',
        monitor: 'Studio monitors',
        desktop: 'Small desktop speakers',
        wall: 'On or in the wall',
      },
      size: {
        label: 'How big?',
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
        tall: '{size}, about {height} tall',
      },
      drivers: {
        label: 'Drivers',
        'two-way': 'Two-way (tweeter and woofer)',
        'three-way': 'Three-way',
        coaxial: 'Coaxial (tweeter in the middle of the woofer)',
      },
      port: {
        label: 'Bass port',
        sealed: 'None (sealed)',
        front: 'At the front',
        rear: 'At the back',
        down: 'At the bottom',
        side: 'At the side',
      },
      placedOn: {
        label: 'They stand on',
        floor: 'The floor',
        stand: 'A stand or shelf',
        desk: 'A desk',
      },
    },
  },
  goals: {
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
    },
  },
  settings: {
    label: 'Settings',
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
      title: 'Tell us about your speakers',
      help: 'Answer what you know. “Not sure” is a fine answer.',
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
    ready: {
      label: 'I’m ready to invest in acoustic treatment',
      help: 'Shows panels and bass traps too. Off: only things you can try today.',
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
    bassPlain: {
      even: 'Even',
      fair: 'Fairly even',
      uneven: 'Uneven',
    },
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
  found: {
    label: 'What we found',
    dead: 'A calm room, with plenty of soft things to soak up sound.',
    balanced: 'A balanced room: not too echoey, not too dead.',
    live: 'A lively room: sound bounces around a lot.',
    lowest: 'Its lowest resonance is at {f}.',
    numbers: 'Reverberation {t60} s.',
  },
  listen: {
    title: 'How does it sound?',
    intro:
      'Play a song you know well and listen from your seat for a minute or two. Then say what you hear. Not sure? Leave it.',
    aspect: {
      bass: { label: 'Bass', thin: 'Thin', right: 'Just right', boomy: 'Boomy' },
      evenness: { label: 'Bass notes', even: 'Even', uneven: 'Some boom or vanish' },
      centre: {
        label: 'Voices in the middle',
        vague: 'Vague',
        focused: 'Focused',
        left: 'Pulled left',
        right: 'Pulled right',
      },
      width: { label: 'Width', narrow: 'Narrow', right: 'Just right', wide: 'Hole in the middle' },
      treble: { label: 'Treble', dull: 'Dull', right: 'Just right', bright: 'Bright, harsh' },
      clarity: { label: 'Clarity', clear: 'Clear', some: 'A little echo', echoey: 'Echoey' },
    },
    short: {
      bass: { thin: 'Thin', right: 'OK', boomy: 'Boomy' },
      evenness: { even: 'Even', uneven: 'Uneven' },
      centre: { vague: 'Vague', focused: 'Firm', left: '◂ Left', right: 'Right ▸' },
      width: { narrow: 'Narrow', right: 'OK', wide: 'Hole' },
      treble: { dull: 'Dull', right: 'OK', bright: 'Harsh' },
      clarity: { clear: 'Clear', some: 'Some echo', echoey: 'Echoey' },
    },
    fixesFor: 'What to try for: {aspect}',
    confidence: {
      physics: 'Usually helps',
      guideline: 'Often helps',
      heuristic: 'Sometimes helps',
      subjective: 'By ear: depends on the speaker',
    },
    model: {
      better: 'The room model expects it to help.',
      same: 'The room model expects about the same.',
      worse: 'The room model expects it to be worse; your ears may disagree.',
    },
    tryIt: 'Try it',
    tried: 'I tried it',
    how: 'You tried: {what} How was it?',
    result: { better: 'Better', same: 'The same', worse: 'Worse', open: 'Not rated yet' },
    putBack: 'Put it back',
    history: 'What you tried',
    nothing:
      'Nothing to move for that here. Check the ideas for the room below, or trust your ears.',
    noLonger: 'That change no longer fits the room as it is now.',
    roomIdeas: 'Ideas for the room',
    roomIdeasHint: 'Rugs, curtains and, if you want to invest, treatment',
    exp: {
      L01: {
        out: 'Move both speakers {by} further from the wall behind them.',
        seatForward: 'Sit {by} further forward, away from the back wall.',
        inward: 'Move each speaker {by} away from its side wall.',
        plug: 'If your speakers came with foam plugs for the bass port, try them in.',
        control: 'If your speakers or amplifier have a bass control, turn it down one step.',
      },
      L02: {
        closer: 'Move both speakers {by} closer to the wall behind them.',
        seatOffMiddle: 'Move your seat {by} away from the middle of the room.',
        small: 'Small speakers stop early in the bass: that is their size, not your room.',
        control: 'If your speakers or amplifier have a bass control, turn it up one step.',
      },
      L03: {
        seatStep: 'Move your seat {by}, listen to the same song, then try {by} the other way.',
        speakerStep: 'Move both speakers {by} further from the wall, then listen again.',
      },
      L04: {
        centreSeat: 'Move your seat {by} sideways, to the middle between the speakers.',
        toeIn: 'Turn both speakers {by} more towards you.',
        height: 'Bring the tweeters to the height of your ears.',
        swap: 'Swap the left and right cables at the amplifier.',
      },
      L05: {
        wider: 'Move the speakers {by} further apart.',
        narrower: 'Move the speakers {by} closer together.',
        sitCloser: 'Sit {by} closer to the speakers.',
        sitBack: 'Sit {by} further back.',
        lessToeIn: 'Turn the speakers {by} less towards you.',
        moreToeIn: 'Turn the speakers {by} more towards you.',
      },
      L06: {
        lessToeIn: 'Turn the speakers {by} less towards you.',
        moreToeIn: 'Turn the speakers {by} more towards you.',
        height: 'Bring the tweeters to the height of your ears.',
        soften: 'Put something soft on a hard surface: a rug, a throw, curtains.',
        trebleDown: 'If your speakers or amplifier have a treble control, turn it down one step.',
        trebleUp: 'If your speakers or amplifier have a treble control, turn it up one step.',
      },
      L07: {
        sitCloser: 'Sit {by} closer to the speakers.',
        soften: 'Put soft things on hard surfaces: a rug, curtains, cushions.',
      },
    },
    why: {
      L01: {
        out: 'A wall close behind a speaker adds bass; a little more space takes some of it away.',
        seatForward: 'Right against the back wall, every bass resonance is at its loudest.',
        inward: 'A side wall or a corner close by adds bass too.',
        plug: 'Makers include them for exactly this: boomy bass near a wall. Not every speaker has them.',
        control: 'A small step is enough. Listen for a while before you decide.',
      },
      L02: {
        closer: 'A wall behind a speaker adds bass. The bass port keeps the space it needs.',
        seatOffMiddle: 'Halfway down a room, the deepest bass notes cancel out.',
        small: 'Closer to the wall gives a little back; beyond that it is the speaker’s limit.',
        control: 'Go easy: more bass also asks more of small speakers.',
      },
      L03: {
        seatStep:
          'The room’s bass resonances change over short distances: one spot is often smoother than the next.',
        speakerStep: 'Moving the speakers also changes which bass notes the room lifts.',
      },
      L04: {
        centreSeat: 'The nearer speaker pulls the voice towards it; a few centimetres are enough.',
        toeIn:
          'Pointing them at you often firms up the centre. It depends on the speaker: trust your ears.',
        height: 'A stand, a few books under the speakers, or a slight tilt towards you.',
        swap: 'If the voice moves to the other side, the cause is the source or the amplifier. If not, swap the speakers: if it follows a speaker, it is that speaker; if neither, it is the room.',
      },
      L05: {
        wider:
          'Wider apart, the stage opens. The usual setup has them 60° apart, seen from your seat.',
        narrower: 'Too far apart, the middle of the stage empties out.',
        sitCloser: 'Closer, the two speakers spread wider around you.',
        sitBack: 'Further away, the two speakers meet in the middle again.',
        lessToeIn:
          'Pointing a little past you can widen the stage. It depends on the speaker: trust your ears.',
        moreToeIn: 'More toe-in fills the middle. It depends on the speaker: trust your ears.',
      },
      L06: {
        lessToeIn: 'Most speakers are a little softer in the treble away from straight ahead.',
        moreToeIn: 'Most speakers are brightest straight ahead.',
        height: 'The treble is clearest when the tweeters point at your ears.',
        soften: 'Bare floors and walls make a room bright; soft things calm it. Use what you have.',
        trebleDown: 'A small step. Listen for a few days before you decide.',
        trebleUp: 'A small step. Listen for a few days before you decide.',
      },
      L07: {
        sitCloser: 'Closer, you hear more of the speakers and less of the room’s echo.',
        soften: 'They shorten the room’s echo. Use what you already have.',
      },
    },
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
    moreTips: 'Listen and fine-tune',
    scores: 'Score now {now}, at its best {best}, out of 1.00.',
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
    withScore: '{word} · {score}',
    absolute: 'Absolute scale',
    hidePanel: 'Hide the side panel',
    best: 'Best',
    now: 'Now: {word}',
    before: 'Before',
    showPanel: 'Show the side panel',
    notListening: 'Not a listening position',
    notStereo: 'Not a stereo spot',
    notSeat: 'No seat here',
    label: 'Map',
    hint: 'Drag anything. The map redraws as you move. Click a number to type an exact value.',
    layerLabel: 'Map layer',
    showing: 'Showing',
    backToMain: 'Back to the main map',
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
      what: 'Where the speakers would sound best, your seat staying where it is. Stronger colour is better.',
    },
    overall: {
      name: 'Overall',
      what: 'How good a seat is here, everything counted equally. The stronger the colour, the better.',
    },
    goals: {
      name: 'My goals',
      what: 'How good each seat is, your speakers staying where they are. Stronger colour is better.',
    },
    bass: {
      name: 'Bass evenness',
      what: 'How even the bass is at this seat. Pale means boomy or thin bass.',
    },
    nulls: {
      name: 'Bass holes',
      what: 'Whether a bass note nearly vanishes here. Pale means a deep hole.',
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
      what: 'Pale means too close to the back wall.',
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
    speakersNot:
      'Not a stereo spot: here the speakers would be too close to you, beside or behind you, or would not fit.',
    speakersFlagged: 'Advised against: furniture is in the way here.',
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
    G11: {
      notInFront:
        'The speakers are beside or behind you, so this is not a stereo setup. Put them in front of you, facing you.',
    },
    G12: {
      onDesk:
        'Sound bouncing off the desk top reaches your ears {delayMs} after the direct sound and cuts a dip near {frequency} (and again higher up). How deep depends on how much sound your speakers send downward. The map does not include the desk.',
      clear:
        'The reflection towards your ears lands off the desk top, so the desk adds little colour.',
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
    title: 'More to try',
    intro:
      'What would help most, in order. Sizes are rough guides, not promises: change one thing, then listen.',
    details: 'Details',
    first: 'If you can only do one thing',
    roomTitle: 'Room treatment',
    settingsTitle: 'Your speakers and how you listen',
    none: 'Nothing to suggest for this setup.',
    invest: 'Bigger investment',
    heldBack:
      'There are bigger options too (panels, bass traps). They need money and time, so they only show once you say you are ready.',
    openSettings: 'Turn it on',
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
    what: 'Where one bass note is loud or silent in your room, with the speakers as they are. Strong colour is loud, pale is quiet.',
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
    C01: {
      desk: 'At a desk, the desk top reflects sound from the speakers to your ears just after the direct sound, which colours it. Raising the speakers on small stands and aiming them down at your ears sends less sound towards the desk, so that reflection gets weaker.',
    },
    C02: {
      quiet:
        'Your speakers reach down to about {lowFrequencyMinus6dB}; the room’s deepest resonance is at {frequency}, well below that, so it is barely excited. The resonances they do reach are already in the map.',
    },
    C03: {
      bed: 'In bed your ears are near the pillow, lower than when you sit. Lower the speakers or tilt them down so the tweeters point at your head: treble is most even on the speaker’s axis.',
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
  advicePlain: {
    T01: {
      absorb:
        '{speaker}: its sound bounces off a hard surface at the marked spot ({boundary}). A soft panel or a diffuser there makes the stereo image sharper.',
      experiment:
        '{speaker}: its sound bounces off a hard surface at the marked spot ({boundary}). Opinions differ on treating it: try something soft there, listen, and keep what you like.',
    },
    T02: {
      rug: 'A thick rug on the floor between you and the speakers, at the marked spot, softens the sound bouncing off the floor. It is cheap: try it.',
      ceilingPanel:
        'A panel on the ceiling at the marked spot would soften its reflection. The side walls matter more, so do those first.',
    },
    T03: {
      moveFirst:
        'The wall behind the speakers cancels part of the bass at your seat. Moving the speakers helps far more than anything you could put on the wall: see the best spots.',
      thickPanel:
        'The wall behind the speakers cancels part of the bass at your seat. A thick absorber behind them softens this a little, but cannot remove it.',
    },
    T04: {
      corners:
        'Bass traps in the corners calm a boomy bass. They have to be big and deep to work: small foam pieces do very little.',
    },
    T05: {
      soften:
        'The room sounds lively and echoey. A large rug and heavy curtains would calm it down.',
      liven: 'The room sounds quite dead. Fewer rugs or curtains would bring back some life.',
    },
    T06: {
      moveFirst:
        'Your head is {distance} from the back wall. Move the seat forward if you can: it helps more than anything else.',
      absorber:
        'Your head is {distance} from the back wall and the seat cannot move. Something thick and soft behind your head helps.',
    },
    C01: {
      desk: 'At a desk, the desk top bounces sound to your ears. Raise the speakers a little and point them at your ears.',
    },
    C02: {
      quiet:
        'Your speakers don’t play as low as your room’s deepest boom, so it stays quiet for you: one thing less to worry about. The map already counts the ones they do reach.',
    },
    C03: {
      bed: 'In bed, your ears are lower than when you sit. Lower the speakers or tilt them down a little, so the tweeters point at your pillow.',
    },
    D01: {
      match:
        'Set the speaker’s wall-distance setting for the {clearance} between its back and the wall. {zone}',
    },
    D02: {
      cut: 'The speakers are close to walls, which makes the bass stronger. Try turning the bass on the speaker down one step, then listen.',
    },
    D03: {
      lift: 'The room swallows high notes. Try turning the treble on the speaker up one step, then listen.',
      cut: 'The room makes high notes ring. Try turning the treble on the speaker down one step, then listen.',
    },
    D04: {
      height:
        'The tweeters are not at ear height. Put the speakers about {baseHeight} above the floor (a stand or desk), or tilt them towards you.',
      tilt: 'The tweeters point above your ears even with the speakers on the floor. Tilt them slightly down towards you, or sit a little higher.',
    },
    D05: {
      moveOut:
        'The port on the back is only {clearance} from the wall; it needs {minimum}. Move the speakers out a little.',
      fixed:
        'The port on the back is only {clearance} from the wall; it needs {minimum}. The manual may offer port plugs or a near-wall setting.',
    },
    D06: {
      desk: 'Your speaker has a desk mode and the speakers stand on a desk: switch it on.',
      stand: 'Use the speaker’s stand mode: the speakers are not on a desk.',
    },
    D07: {
      bassCut:
        'The speakers are close to walls, which makes the bass stronger. If your speakers or amplifier have a bass control, try turning it down a little, then listen.',
      trebleLift:
        'The room swallows high notes. If your speakers or amplifier have a treble control, try turning it up a little, then listen.',
      trebleCut:
        'The room makes high notes ring. If your speakers or amplifier have a treble control, try turning it down a little, then listen.',
    },
  },
  analysis: {
    updating: 'Updating…',
    updatingLarge: 'Updating… a room this large takes a few seconds.',
    error: 'Something went wrong calculating this. Your data is safe.',
    copyDetails: 'Copy details',
  },
  crash: {
    title: 'This room cannot be shown',
    body: 'Something in it confused the app. Start again with an empty room; nothing else is lost.',
    newProject: 'Start over',
    details: 'Technical details',
  },
  whyTab: {
    onMap: 'See it on the map',
    onMapHelp:
      'Each reason has its own map: the stronger the colour, the better; pale is where that reason hurts.',
    closer: 'Look closer',
  },
  model: {
    note: 'A physics model of an empty box: a starting point, not a measurement.',
    more: 'What it knows',
  },
  variant: {
    current: 'Current',
  },
  dock: {
    room: 'Room',
    side: 'Side view',
  },
  nav: {
    bass: 'Bass at your seat',
    notSet: 'Not set',
  },
  sheet: {
    expand: 'Show more',
    collapse: 'Show less',
  },
  about: {
    title: 'About',
    body: 'This app uses established room acoustics to suggest speaker and seat positions, and tells you how sure it is. It is guidance, not a guarantee.',
    knowsTitle: 'What the model knows, and what it cannot',
    knows:
      'It treats your room as a closed rectangular box with the materials you chose and the furnishing you described. From that it computes the room’s resonances, the sound bouncing off the walls next to the speakers, the reflections reaching your seat and the stereo geometry.',
    cannot:
      'It cannot see how widely your speakers spread sound, your actual furniture, your desk, doors and openings, or what a microphone at your seat would show. Its numbers are estimates with ranges, not a measurement. Use it to find a good starting point; the last few centimetres are for your ears.',
    sources: 'Every rule and its sources are documented in the project’s rule catalogue.',
    support: 'Support this project ☕ (opens in a new tab)',
  },
} as const;
