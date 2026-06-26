export const CASES = [
  {
    id:"gala",
    title:"The Crimson Gala",
    setting:"Rooftop Gala — Midnight",
    summary:"A billionaire found dead at his own birthday party. The champagne flute still in his hand.",
    victim:"Victor Harmon, 67 — CEO of Harmon Industries",
    cause:"Cyanide poisoning — targeted single champagne glass",
    killer:"Diana Voss",
    killerReason:"Diana served as Victor's PA for 12 years and was removed from his will last week when she discovered plans to sell the company. She slipped cyanide into his champagne during a 4-minute security camera gap she created herself.",
    narratorIntro:"The city never sleeps, but tonight it holds its breath. Victor Harmon — a man who bought and sold empires — is dead on his own rooftop. And somewhere in this room, someone is already rehearsing their alibi.",
    theme:"gold",
    suspects:[
      {
        id:"diana",name:"Diana Voss",role:"Personal Assistant",age:34,avatar:"👩‍💼",guilty:true,
        alibi:"Claims she was at the bar the entire time",
        secret:"Was seen near the victim's drink 10 minutes before his death",
        dossier:{
          background:"12-year PA to Victor Harmon. Privy to all company secrets. Removed from his will last week when she discovered the sale plans.",
          associates:"Board of Harmon Industries, estate lawyer, Victor's ex-wife",
          record:"No prior record. Clean background check.",
          financials:"Annual salary $95k. Four maxed credit cards. No savings. Recently denied a personal loan."
        },
        timeline:[
          {t:"9:00pm",a:"Arrived with Victor at the gala"},
          {t:"10:30pm",a:"Seen arguing with Victor near the private suite"},
          {t:"11:40pm",a:"At the bar — location unconfirmed"},
          {t:"11:43pm",a:"CAMERA GAP BEGINS — 4 minutes of missing footage"},
          {t:"11:47pm",a:"Camera resumes — Diana back at bar"},
          {t:"11:52pm",a:"Bartender notices her visibly flushed, hands shaking"},
          {t:"11:58pm",a:"Victor Harmon collapses"},
        ]
      },
      {
        id:"marcus",name:"Marcus Harmon",role:"Son & Heir",age:42,avatar:"👨‍💼",guilty:false,
        alibi:"Was on stage giving a speech — confirmed by 60 witnesses",
        secret:"Carries $2.1M in gambling debts from casino accounts in three states",
        dossier:{
          background:"Victor's son from his first marriage. Estranged for years, reconnected recently. Runs a failing property development firm.",
          associates:"Casino debt collectors, estate lawyers, shell company investors",
          record:"DUI 2018, dismissed. One civil lawsuit, settled.",
          financials:"$2.1M in gambling debts. Shell company draining assets. Would have needed inheritance immediately."
        },
        timeline:[
          {t:"9:00pm",a:"Arrived late — security noted nervous demeanor"},
          {t:"10:00pm",a:"On stage giving speech — confirmed by 60 attendees"},
          {t:"10:28pm",a:"Speech ends, returns to bar area"},
          {t:"11:30pm",a:"Ordering multiple whiskeys — bar receipt confirms"},
          {t:"12:00am",a:"Still at bar when body found — alibi solid"},
        ]
      },
      {
        id:"elena",name:"Elena Vance",role:"Business Rival",age:55,avatar:"👩‍💼",guilty:false,
        alibi:"Left early — valet log confirms departure at 11:15pm",
        secret:"Was in secret merger negotiations with Victor Harmon that she publicly denied",
        dossier:{
          background:"CEO of VanceCorp, Victor's main competitor for 20 years. Secret merger talks this year despite public rivalry.",
          associates:"Wall Street brokers, merger lawyers, VanceCorp board",
          record:"No criminal record. Two SEC filings of interest, resolved.",
          financials:"Net worth $340M. No financial motive. Merger would have benefited her."
        },
        timeline:[
          {t:"9:00pm",a:"Arrived alone, no entourage"},
          {t:"10:15pm",a:"Private meeting in VIP lounge — unknown attendee"},
          {t:"11:15pm",a:"Departed — valet log timestamp confirmed"},
          {t:"11:58pm",a:"Time of death — Elena not present"},
        ]
      },
      {
        id:"chef",name:"Chef Remy Blanc",role:"Head Caterer",age:48,avatar:"👨‍🍳",guilty:false,
        alibi:"In the kitchen all night — confirmed by three kitchen staff",
        secret:"Was being blackmailed by Victor over a covered-up health code violation in 2019",
        dossier:{
          background:"Renowned Michelin-starred chef. Has catered Harmon events for 7 years. Victor discovered the violation and used it as leverage to get below-market catering rates.",
          associates:"Kitchen staff, restaurant investors, food critics",
          record:"One count of obstruction of justice — 2019, settled privately.",
          financials:"Restaurant struggling post-pandemic. Blackmail payments draining reserves."
        },
        timeline:[
          {t:"6:00pm",a:"Arrived to set up catering"},
          {t:"9:00pm",a:"Service begins — in kitchen"},
          {t:"11:00pm",a:"In kitchen — confirmed by sous chef"},
          {t:"12:00am",a:"Still in kitchen when body discovered"},
        ]
      },
    ],
    clues:[
      {id:"c1",name:"Cyanide Residue",desc:"Trace cyanide found only in the victim's champagne flute — not in any open bottles. A targeted, deliberate addition.",critical:true,room:"Rooftop Bar",found:false},
      {id:"c2",name:"Broken Nail Fragment",desc:"A manicured acrylic nail found under the drink station. Lab confirms it matches Diana Voss's missing thumbnail.",critical:true,room:"Rooftop Bar",found:false},
      {id:"c3",name:"Deleted Calendar Entry",desc:"Recovered from Victor's phone cloud backup: deleted meeting labeled 'D.V. — severance terms' scheduled for tomorrow morning.",critical:false,room:"Victim's Suite",found:false},
      {id:"c4",name:"Security Camera Gap",desc:"Four minutes of footage (11:43-11:47pm) near the bar was manually looped from the security terminal. Done by someone who knew the system.",critical:false,room:"Security Office",found:false},
      {id:"c5",name:"Bar Tab Receipt",desc:"Marcus Harmon's credit card receipt: 6 whiskeys ordered between 10pm and midnight. Bartender and receipt confirm his position throughout.",critical:false,room:"VIP Lounge",found:false},
      {id:"c6",name:"Valet Departure Log",desc:"Parking log shows Elena Vance's car retrieved at 11:15pm — 43 minutes before the estimated time of death.",critical:false,room:"Kitchen Entrance",found:false},
    ],
    rooms:["Rooftop Bar","VIP Lounge","Kitchen Entrance","Security Office","Victim's Suite"],
    witnesses:[
      {
        id:"w1",name:"Jake Torres",role:"Head Bartender",avatar:"🧑‍🍳",
        summary:"Worked the rooftop bar all night. Sharp memory. Noticed something he didn't initially report.",
        statements:[
          {trigger:"general",text:"Mr. Harmon seemed fine when he arrived — laughing, working the room. But around 11:30pm I noticed Diana at the far end of the bar just watching him. Not ordering anything. Just watching with this look I can't quite describe."},
          {trigger:"diana",text:"She was here — but not the whole time like she told you. I stepped away around 11:40 to restock ice from the back. When I returned about ten minutes later, she was back at the bar. But her hands were shaking and she wouldn't make eye contact."},
          {trigger:"suspicious",text:"After the police arrived I found something under the bar mat. A small glass vial — the kind you'd use for medicine or perfume. It smelled like bitter almonds. I panicked and put it in my jacket pocket. I have it with me right now."},
          {trigger:"marcus",text:"Marcus was at my end of the bar most of the night. Heavy drinker — I cut him off once, he got the next bartender to serve him. He never went near his father's section."},
        ]
      },
      {
        id:"w2",name:"Clara Huang",role:"Event Photographer",avatar:"📸",
        summary:"Shot the entire event with a long telephoto lens. People forget she's there. Her SD card may hold the key.",
        statements:[
          {trigger:"general",text:"I've photographed 60 of these events. People stop performing when they think the camera is elsewhere. Diana was completely composed all night — until about 11:35. She checked her phone and her face just... changed. Went completely cold."},
          {trigger:"diana",text:"I have a photograph. Timestamped 11:44pm. Diana near the drink station — I was using a 200mm lens from the stairwell. Her arm is clearly extended toward the bar. I can enhance it."},
          {trigger:"camera",text:"Whoever looped the security footage didn't account for me. My camera records to an SD card independently. I have those four missing minutes. I haven't deleted anything."},
          {trigger:"marcus",text:"Marcus gave an emotional speech. Looked genuinely upset about his father — or he's a very good actor. He was visible on stage from 10:00 to 10:28 and then immediately went back to the bar."},
        ]
      },
    ],
    interrogationQuestions:{
      diana:[
        {q:"Where exactly were you standing between 11:40 and 11:50pm?"},
        {q:"We found a broken nail near the victim's champagne. Is that yours?"},
        {q:"When did you last speak privately with Victor today?"},
      ],
      marcus:[
        {q:"How much debt are you carrying across all your accounts?"},
        {q:"Were you aware your father planned to change the will?"},
      ],
      elena:[{q:"Tell me about the merger discussions you've been denying."}],
      chef:[{q:"How long has Victor Harmon been blackmailing you?"}],
    },
    reverseInterrogation:{
      alibi:"I was reviewing crime scene photographs and interviewing catering staff near the kitchen entrance.",
      secret:"You arrived 20 minutes after your logged call-in time and used the service entrance rather than the main door.",
      questions:[
        "Your sign-in timestamp shows you entered through the service entrance — the same route the killer likely used. Walk me through that.",
        "We found your fingerprints on the victim's champagne glass. Why would a detective handle key evidence without gloves at an active crime scene?",
        "A witness places you at a charity event three weeks ago where you had a heated argument with Victor Harmon. What was that about?",
        "You took 22 minutes longer than standard protocol to secure the perimeter. What were you doing in that time?",
      ],
    },
    crossExam:{
      diana:{
        contradiction:"Diana claims she was standing at the bar throughout the 11:43-11:47pm window — but that's exactly when the security footage shows a manual loop was initiated from a terminal three meters from where she claims she was standing.",
        pressure:"the camera gap timing and the broken nail fragment",
        threshold:2,
      },
      marcus:{
        contradiction:"Marcus insists the inheritance timing would have been 'terrible' for him — yet phone records show he met with an estate attorney specializing in expedited inheritance claims just two weeks ago.",
        pressure:"the secret lawyer meetings and the gambling debt timeline",
        threshold:3,
      },
    },
  },
  {
    id:"museum",
    title:"The Missing Vermeer",
    setting:"City Modern Art Museum — 2am",
    summary:"A priceless Vermeer painting vanished during a gala opening. The motion sensors never triggered.",
    victim:"'Girl with a Pearl Earring II' — estimated value $80 million",
    cause:"Inside job — master security override, precise 4-minute window",
    killer:"Noah Park",
    killerReason:"Noah Park was approached by a private collector operating through a shell company three months ago. He disabled the motion sensors during a self-created gap between guard rotations, handed off the painting through a service entrance, and called in the theft himself to control the initial response.",
    narratorIntro:"They say art is eternal. Tonight, $80 million worth of eternity walked out the front door in broad darkness. Somebody in this building knew exactly when to move, exactly what to disable, and exactly how to disappear.",
    theme:"teal",
    suspects:[
      {
        id:"noah",name:"Noah Park",role:"Head of Security",age:38,avatar:"👮",guilty:true,
        alibi:"Claims he was executing his scheduled patrol rounds",
        secret:"Three unexplained deposits totaling $220,000 in offshore accounts over the past 90 days",
        dossier:{
          background:"15-year security veteran. Former police officer. Left the force following an internal affairs investigation in 2019 — no charges filed but reputation damaged.",
          associates:"Private collectors network (informal), offshore financial broker, former IA colleagues",
          record:"IA investigation 2019 — no charges filed. Sealed records.",
          financials:"Salary $62k annually. Offshore accounts totaling $220k in recent unexplained deposits. No other assets."
        },
        timeline:[
          {t:"8:00pm",a:"Started shift — normal behavior reported"},
          {t:"10:00pm",a:"Sent junior guard Officer Chen on extended break"},
          {t:"11:50pm",a:"Seen near sensor terminal — claimed 'diagnostic'"},
          {t:"11:54pm",a:"Master sensor disable initiated — 4 minute window"},
          {t:"11:58pm",a:"Sensors re-enabled"},
          {t:"12:05am",a:"Noah himself calls in the theft — first to report"},
        ]
      },
      {
        id:"curator",name:"Dr. Sofia Chen",role:"Lead Curator",age:51,avatar:"👩‍🎨",guilty:false,
        alibi:"At the gala donor dinner from 9pm to midnight — confirmed by 8 attendees",
        secret:"Signed off on a forged authentication certificate for a minor piece in 2022 — a scandal she buried",
        dossier:{
          background:"20-year museum veteran. Internationally respected. One significant authentication dispute in 2022 that was quietly settled.",
          associates:"Art world elite, auction houses, international art critics",
          record:"No criminal record. 2022 authentication dispute — civil matter, settled.",
          financials:"Salary $110k. Clean personal finances. No unusual transactions."
        },
        timeline:[
          {t:"7:00pm",a:"Oversaw final gala setup"},
          {t:"9:00pm",a:"Seated at donor dinner — confirmed by 8 guests"},
          {t:"11:45pm",a:"Still at dinner table — multiple witnesses"},
          {t:"12:10am",a:"First senior staff member on scene after alert"},
        ]
      },
      {
        id:"restorer",name:"Kai Brennan",role:"Art Restorer",age:29,avatar:"🎨",guilty:false,
        alibi:"Left the museum at 10pm — badge swipe timestamp confirmed",
        secret:"Has the technical skills to produce an indistinguishable replica of any masterwork",
        dossier:{
          background:"Prodigy-level restorer. Known in certain circles for producing technically perfect copies of masterworks 'for study purposes.' Controversial but not illegal.",
          associates:"Private galleries, informal art forger community, past auction house contacts",
          record:"No criminal record.",
          financials:"Freelance income — variable. Recent uptick in private commissions."
        },
        timeline:[
          {t:"6:00pm",a:"Completed restoration work on east gallery"},
          {t:"10:07pm",a:"Badge exit swipe — confirmed departure, 2 hours before theft"},
        ]
      },
      {
        id:"patron",name:"Vivienne Lau",role:"Major Donor & Collector",age:63,avatar:"👩‍💼",guilty:false,
        alibi:"At the dinner table until midnight — confirmed by 4 independent witnesses",
        secret:"Has been attempting to acquire this specific painting through private channels for five years — all offers rejected",
        dossier:{
          background:"Billionaire art collector. Submitted a $4M private purchase offer for the Vermeer three years ago — declined by the museum board.",
          associates:"Major art brokers, private collection specialists, museum board members",
          record:"No criminal record.",
          financials:"Net worth $1.2 billion. Could purchase the museum outright. No financial pressure."
        },
        timeline:[
          {t:"7:00pm",a:"Arrived with personal entourage"},
          {t:"9:00pm",a:"Donor dinner — seated"},
          {t:"11:45pm",a:"Still at table — confirmed by museum director"},
          {t:"12:05am",a:"Notified of theft by staff — visibly shocked"},
        ]
      },
    ],
    clues:[
      {id:"c1",name:"Sensor Override Log",desc:"Terminal logs show a 4-minute master disable at 11:54pm. System records confirm only Noah Park's biometric credentials can authorize this override.",critical:true,room:"Security Center",found:false},
      {id:"c2",name:"Offshore Wire Transfer",desc:"Bank records show $180,000 transferred to Noah Park's offshore account from a shell company registered in the Cayman Islands — 72 hours after the theft.",critical:true,room:"Security Center",found:false},
      {id:"c3",name:"Blank Replica Canvas",desc:"A blank pre-stretched canvas found in Noah Park's personal locker, matching the Vermeer's exact dimensions and framing specifications.",critical:false,room:"Storage Vault",found:false},
      {id:"c4",name:"Sofia's Forgery Document",desc:"A 2022 authentication certificate bearing Sofia Chen's signature for a piece later determined to be a forgery. Not connected to this theft, but undermines her credibility.",critical:false,room:"Restorer's Workshop",found:false},
      {id:"c5",name:"Kai's Exit Badge Record",desc:"Electronic badge confirms Kai Brennan exited the museum at 10:07pm — exactly 107 minutes before the sensor override. His departure is not in question.",critical:false,room:"Gallery Hall A",found:false},
      {id:"c6",name:"Vivienne's Private Offer Letter",desc:"A formal private purchase offer for $4 million submitted by Vivienne Lau three years ago. Declined by the board. Establishes obsession but not means.",critical:false,room:"Donor Lounge",found:false},
    ],
    rooms:["Gallery Hall A","Security Center","Storage Vault","Restorer's Workshop","Donor Lounge"],
    witnesses:[
      {
        id:"w1",name:"Officer Ray Chen",role:"Junior Security Guard",avatar:"👮",
        summary:"Was on patrol that night. Noah sent him on an unexplained extended break. Noticed behavior he didn't connect until now.",
        statements:[
          {trigger:"general",text:"Noah told me to take a 20-minute break at around 11:45 — go get coffee, take my time. That's never happened before. He's the one who's usually strict about rotation schedules. I thought he was just being nice."},
          {trigger:"noah",text:"I walked past the sensor terminal room around 11:50 on my way back. Noah was at the keyboard. Said he was running a routine diagnostic. I didn't question it. The timeline matches exactly when the logs show the disable command was entered."},
          {trigger:"suspicious",text:"After the theft was reported and everyone was panicking — Noah was the calmest person in the building. Not just calm. Almost relieved. In five years of working with him I've never seen him calm during an incident. He's always the most stressed. It stayed with me."},
        ]
      },
      {
        id:"w2",name:"Mia Torres",role:"Coat Check Attendant",avatar:"🧣",
        summary:"Stationed near the main entrance all night. Clear sightlines. Good memory for faces and times.",
        statements:[
          {trigger:"general",text:"I'm at that desk for six hours straight. I see everyone who comes and goes. Vivienne Lau didn't move — she held court at that dinner table the entire night. Her people came to her, she didn't go anywhere."},
          {trigger:"noah",text:"Noah walked past my station twice near midnight. First pass — coat on, radio in hand, looked normal. Second pass about 12 minutes later — no coat, slightly out of breath, didn't make eye contact. That second pass was odd."},
          {trigger:"restorer",text:"Kai left right around 10, maybe 10:05. He said goodnight. He looked tired, not nervous. I'd stake my job on the fact that he didn't come back through my entrance. I would have seen him."},
        ]
      },
    ],
    interrogationQuestions:{
      noah:[
        {q:"Walk me through your exact location and activity at 11:50pm."},
        {q:"The override log shows your biometric credentials were used. How is that possible if you weren't at the terminal?"},
        {q:"$180,000 appeared in an offshore account registered to you 72 hours after the theft. Explain that."},
      ],
      curator:[
        {q:"Tell me about the forged authentication certificate you signed in 2022."},
        {q:"You were first on scene. What was Noah's demeanor when you arrived?"},
      ],
    },
    reverseInterrogation:{
      alibi:"I was off duty when the incident occurred and was called in afterward by the duty sergeant.",
      secret:"Your precinct received a $50,000 'community support' donation from the museum foundation last month.",
      questions:[
        "Your precinct received $50,000 from the museum foundation last month. Doesn't that create a conflict of interest in your investigation?",
        "Museum staff places you at a private dinner with Vivienne Lau two weeks before the theft. What was the nature of that meeting?",
        "Three years ago you cleared Noah Park in a prior security incident at this same museum. Are you sure your judgment isn't compromised?",
        "This is the fourth high-value art theft case assigned to your unit this year. None resolved. Is there a pattern we should be concerned about?",
      ],
    },
    crossExam:{
      noah:{
        contradiction:"Noah claims his keycard was stolen before the incident — yet the museum's electronic access log shows his personal keycard was used at his private staff locker just 40 minutes before the sensor override. You can't be in two places at once.",
        pressure:"the locker access timestamp and the biometric confirmation",
        threshold:2,
      },
      curator:{
        contradiction:"Dr. Chen has stated repeatedly that she had no knowledge of the 2022 forgery certificate — but the document itself carries her original wet signature on the authorization line. Not a copy. Her actual signature.",
        pressure:"her own handwritten signature on the document",
        threshold:3,
      },
    },
  },
];
