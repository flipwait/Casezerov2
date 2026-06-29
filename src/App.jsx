bash

cat > /mnt/user-data/outputs/casezero-v3.jsx << 'ENDOFFILE'
import React, { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// DESIGN TOKENS
// ============================================================
const T = {
  abyss:"#06080C",void:"#0A0C12",shadow:"#10131A",dusk:"#181C26",smoke:"#1F2330",
  gold:"#C9AA71",goldBright:"#E8C97A",goldDim:"#7A6535",
  red:"#E03020",redDim:"#8A2010",
  teal:"#22D4B4",tealDim:"#0D8070",
  purple:"#9B7FD4",purpleDim:"#5A3F8A",
  paper:"#EDE9E0",ink:"#EDE9E0",inkSec:"#8A8FA8",inkMut:"#42475A",
  green:"#30D46A",amber:"#F0A020",orange:"#E07030",blue:"#4488EE",
  crimson:"#CC2244",
};
const PLAYER_COLORS=["#22D4B4","#C9AA71","#E03020","#30D46A","#9B7FD4","#E07030","#4488EE","#E91E63"];
const CLAUDE_MODELS=[
  {id:"claude-sonnet-4-6",label:"Claude Sonnet 4.6",desc:"Smart & fast — recommended",tier:"standard"},
  {id:"claude-haiku-4-5-20251001",label:"Claude Haiku 4.5",desc:"Fastest, most efficient",tier:"fast"},
  {id:"claude-opus-4-6",label:"Claude Opus 4.6",desc:"Maximum intelligence",tier:"advanced"},
];
const DIFFICULTY={
  easy:{id:"easy",label:"Rookie",icon:"🟢",desc:"2 critical clues free. Unlimited hints. Suspects crack fast. 30 min timer.",freeClues:2,unlimitedHints:true,crackMult:0.6,timer:30,reverseQ:2,permadeath:false,lieDetectorForce:true,patienceBase:8},
  medium:{id:"medium",label:"Detective",icon:"🟡",desc:"Standard. 1 hint per round. Balanced. 20 min timer.",freeClues:0,unlimitedHints:false,crackMult:1.0,timer:20,reverseQ:3,permadeath:false,lieDetectorForce:false,patienceBase:5},
  hard:{id:"hard",label:"Chief Inspector",icon:"🔴",desc:"No hints. Hard cracking. Wrong accusation = game over. 15 min timer.",freeClues:0,unlimitedHints:false,crackMult:1.8,timer:15,reverseQ:4,permadeath:true,lieDetectorForce:false,patienceBase:3},
};
const MOODS={
  cooperative:{label:"Cooperative",icon:"😌",color:"#22D4B4",desc:"Open, gives extra detail"},
  nervous:{label:"Nervous",icon:"😰",color:"#C9AA71",desc:"Anxious, prone to slips"},
  defensive:{label:"Defensive",icon:"😤",color:"#E07030",desc:"Guarded, short answers"},
  hostile:{label:"Hostile",icon:"😠",color:"#E03020",desc:"Refuses to elaborate"},
  lawyered:{label:"Lawyered Up",icon:"⚖",color:"#9B7FD4",desc:"Refuses to answer without counsel"},
};
const getMood=(count,guilty,patience)=>{
  if(patience<=0)return"lawyered";
  if(count===0)return guilty?"nervous":"cooperative";
  if(count<=2)return guilty?"defensive":"nervous";
  if(count<=4)return guilty?"hostile":"defensive";
  return guilty?"hostile":"cooperative";
};
const TIMER_OPTS=[{v:0,l:"Off"},{v:15,l:"15 min"},{v:20,l:"20 min"},{v:30,l:"30 min"},{v:45,l:"45 min"}];

// NEWS TICKER ESCALATION
const NEWS_STAGES=[
  {threshold:0,urgency:"low",headlines:["Breaking: Incident reported at event venue","Police respond to scene","Witnesses describe chaotic scene"]},
  {threshold:40,urgency:"medium",headlines:["Suspect still at large — police widen search","DA pressures detectives for arrest","Public fear grows as killer walks free","Sources: investigation stalled with no leads"]},
  {threshold:70,urgency:"high",headlines:["KILLER STILL FREE — Mayor demands answers","Police chief under fire: no arrest after hours","Witnesses now refusing to cooperate","Suspects retain lawyers as pressure mounts"]},
  {threshold:90,urgency:"critical",headlines:["🚨 CRITICAL: Killer believed to be fleeing city","Emergency meeting: DA to take over investigation","Detectives under formal review","Last chance — killer spotted near border"]},
];

// ============================================================
// SCENE MAPS — top-down floor plans per case
// ============================================================
const SCENE_MAPS={
  gala:{
    label:"Rooftop Gala — Floor Plan",
    width:520,height:340,
    rooms:[
      {id:"Rooftop Bar",x:20,y:20,w:160,h:100,color:"#C9AA7118",border:"#C9AA7150",icon:"🍾",label:"Rooftop Bar"},
      {id:"VIP Lounge",x:200,y:20,w:140,h:100,color:"#22D4B418",border:"#22D4B450",icon:"🛋",label:"VIP Lounge"},
      {id:"Kitchen Entrance",x:360,y:20,w:140,h:100,color:"#E0703018",border:"#E0703050",icon:"🍽",label:"Kitchen"},
      {id:"Security Office",x:20,y:140,w:140,h:100,color:"#9B7FD418",border:"#9B7FD450",icon:"📷",label:"Security"},
      {id:"Victim's Suite",x:180,y:140,w:160,h:100,color:"#E0302018",border:"#E0302050",icon:"💀",label:"Victim's Suite"},
    ],
    connections:[
      {from:"Rooftop Bar",to:"VIP Lounge"},{from:"VIP Lounge",to:"Kitchen Entrance"},
      {from:"Rooftop Bar",to:"Security Office"},{from:"VIP Lounge",to:"Victim's Suite"},
    ],
  },
  museum:{
    label:"City Museum — Floor Plan",
    width:520,height:340,
    rooms:[
      {id:"Gallery Hall A",x:20,y:20,w:150,h:110,color:"#C9AA7118",border:"#C9AA7150",icon:"🖼",label:"Gallery A"},
      {id:"Security Center",x:190,y:20,w:140,h:110,color:"#E0302018",border:"#E0302050",icon:"📷",label:"Security"},
      {id:"Storage Vault",x:350,y:20,w:150,h:110,color:"#9B7FD418",border:"#9B7FD450",icon:"🔒",label:"Vault"},
      {id:"Restorer's Workshop",x:20,y:150,w:160,h:110,color:"#22D4B418",border:"#22D4B450",icon:"🎨",label:"Workshop"},
      {id:"Donor Lounge",x:200,y:150,w:160,h:110,color:"#F0A02018",border:"#F0A02050",icon:"🍷",label:"Donor Lounge"},
    ],
    connections:[
      {from:"Gallery Hall A",to:"Security Center"},{from:"Security Center",to:"Storage Vault"},
      {from:"Gallery Hall A",to:"Restorer's Workshop"},{from:"Security Center",to:"Donor Lounge"},
    ],
  },
  starfall:{
    label:"Starfall Express — Train Layout",
    width:520,height:200,
    rooms:[
      {id:"Marsh's Sleeper",x:20,y:50,w:110,h:100,color:"#E0302018",border:"#E0302050",icon:"💀",label:"Marsh's Cabin"},
      {id:"Sera's Cabin",x:150,y:50,w:100,h:100,color:"#9B7FD418",border:"#9B7FD450",icon:"🧳",label:"Sera's Cabin"},
      {id:"Helena's Cabin",x:270,y:50,w:100,h:100,color:"#22D4B418",border:"#22D4B450",icon:"✍",label:"Helena's Cabin"},
      {id:"Bar Car",x:390,y:50,w:80,h:100,color:"#C9AA7118",border:"#C9AA7150",icon:"🥃",label:"Bar Car"},
      {id:"Train Corridor",x:20,y:165,w:450,h:25,color:"#1F233040",border:"#42475A",icon:"",label:"Corridor"},
    ],
    connections:[
      {from:"Marsh's Sleeper",to:"Sera's Cabin"},{from:"Sera's Cabin",to:"Helena's Cabin"},
      {from:"Helena's Cabin",to:"Bar Car"},
    ],
  },
};

// ============================================================
// AI ENGINE
// ============================================================
const AI_ERR="[AI_ERROR]";
const isAIErr=(t)=>!t||t.startsWith(AI_ERR)||(t.startsWith("[")&&t.includes("error"));

async function callAI(prompt,sys,_ctx,settings){
  const model=settings.claudeModel||"claude-sonnet-4-6";
  try{
    const messages=[{role:"user",content:prompt}];
    const body={model,max_tokens:1000,messages};
    if(sys)body.system=sys;
    const res=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),
    });
    if(!res.ok){
      let eb="";
      try{const ej=await res.json();eb=ej?.error?.message||"";}catch{eb=await res.text().catch(()=>"");}
      if(res.status===401)return AI_ERR+" Authentication failed.";
      if(res.status===429)return AI_ERR+" Rate limit. Wait a moment.";
      return AI_ERR+" API error "+res.status+": "+eb.slice(0,80);
    }
    const data=await res.json();
    const text=data?.content?.map(b=>b.type==="text"?b.text:"").join("").trim();
    if(!text)return AI_ERR+" Empty response.";
    return text;
  }catch(err){return AI_ERR+" "+err.message;}
}

function safeJSON(raw,fallback){
  if(!fallback)fallback={};
  if(isAIErr(raw))return Object.assign({},fallback,{_error:raw});
  try{return JSON.parse(raw.replace(/```json|```/g,"").trim());}
  catch{
    const m=raw.match(/\{[\s\S]*\}/);
    if(m)try{return JSON.parse(m[0]);}catch{}
    return Object.assign({},fallback,{_parseError:true,_raw:raw.slice(0,200)});
  }
}

async function speakText(text,settings){
  if(!settings.voiceEnabled||!settings.elevenLabsKey||!settings.elevenLabsVoiceId||isAIErr(text))return;
  try{
    const res=await fetch("https://api.elevenlabs.io/v1/text-to-speech/"+settings.elevenLabsVoiceId,{
      method:"POST",headers:{"xi-api-key":settings.elevenLabsKey,"Content-Type":"application/json"},
      body:JSON.stringify({text,model_id:"eleven_monolingual_v1"}),
    });
    if(!res.ok)return;
    new Audio(URL.createObjectURL(await res.blob())).play();
  }catch(e){console.warn("[TTS]",e.message);}
}

// ============================================================
// CASES
// ============================================================
const CASES=[
  {
    id:"gala",title:"The Crimson Gala",setting:"Rooftop Gala — Midnight",
    badge:"🍾",difficulty:"medium",
    summary:"A billionaire found dead at his own birthday party. The champagne flute still in his hand.",
    victim:"Victor Harmon, 67 — CEO of Harmon Industries",
    cause:"Cyanide poisoning — targeted single champagne glass",
    killer:"Diana Voss",
    killerReason:"Diana served as Victor's PA for 12 years. Removed from his will last week when she discovered plans to sell the company. She slipped cyanide into his champagne during the 4-minute security camera gap she created herself.",
    narratorIntro:"The city never sleeps, but tonight it holds its breath. Victor Harmon is dead on his own rooftop. And somewhere in this room, someone is already rehearsing their alibi.",
    polaroids:[
      {id:"p1",label:"Crime Scene",caption:"Champagne flute still in Harmon's hand. No signs of struggle.",emoji:"🍾"},
      {id:"p2",label:"Bar Area",caption:"Bar station unmanned for 4 minutes. Camera angle deliberately blocked.",emoji:"🎥"},
      {id:"p3",label:"Victim's Hand",caption:"Faint chemical residue around fingertips — not from the drink.",emoji:"🧪"},
    ],
    suspects:[
      {id:"diana",name:"Diana Voss",role:"Personal Assistant",age:34,avatar:"👩‍💼",guilty:true,
       alibi:"Claims she was at the bar the entire time",secret:"Was seen near victim's drink 10 minutes before death",
       psych:{archetype:"The Loyal Betrayed",traits:["Meticulous","Calculating","Wounded pride"],tell:"Touches left wrist when lying — missing the watch Victor gave her"},
       dossier:{background:"12-year PA to Victor. Removed from will last week.",associates:"Board of Harmon Industries, estate lawyer",record:"Clean",financials:"$95k salary, maxed credit cards"},
       timeline:[{t:"9:00pm",a:"Arrived with Victor"},{t:"10:30pm",a:"Seen arguing with Victor near suite"},{t:"11:40pm",a:"At bar — unconfirmed"},{t:"11:47pm",a:"CAMERA GAP — 4 minutes"},{t:"11:52pm",a:"Returned visibly flushed, hands shaking"}],
       fingerprint:"loop",uvClue:"Cyanide micro-residue on right glove lining — only visible under UV"},
      {id:"marcus",name:"Marcus Harmon",role:"Son & Heir",age:42,avatar:"👨‍💼",guilty:false,
       alibi:"Was giving a speech on stage — 60 witnesses",secret:"$2.1M gambling debts",
       psych:{archetype:"The Desperate Heir",traits:["Impulsive","Charming facade","Deeply in debt"],tell:"Laughs nervously when cornered"},
       dossier:{background:"Victor's son. Failing property firm.",associates:"Debt collectors, lawyers",record:"DUI 2018",financials:"$2.1M gambling debt"},
       timeline:[{t:"9:00pm",a:"Arrived late, nervous"},{t:"10:00pm",a:"Speech — 60 witnesses"},{t:"11:30pm",a:"Bar — whiskeys"},{t:"12:00am",a:"Still at bar"}],
       fingerprint:"whorl",uvClue:"Nothing unusual detected"},
      {id:"elena",name:"Elena Vance",role:"Business Rival",age:55,avatar:"👩‍💼",guilty:false,
       alibi:"Left early — valet confirmed 11:15pm",secret:"Secret merger negotiations with Victor",
       psych:{archetype:"The Power Player",traits:["Cold","Strategic","Respected fear"],tell:"Gives too much detail — classic over-explanation"},
       dossier:{background:"CEO of VanceCorp, 20yr rival.",associates:"Wall Street brokers",record:"None",financials:"$340M net worth"},
       timeline:[{t:"9:00pm",a:"Arrived alone"},{t:"11:15pm",a:"Departed — valet confirmed"}],
       fingerprint:"arch",uvClue:"Nothing unusual detected"},
      {id:"chef",name:"Chef Remy Blanc",role:"Head Caterer",age:48,avatar:"👨‍🍳",guilty:false,
       alibi:"In kitchen all night — 3 witnesses",secret:"Blackmailed by Victor over a health code violation",
       psych:{archetype:"The Cornered Professional",traits:["Proud","Secretive","Volatile under pressure"],tell:"Deflects with irrelevant food details"},
       dossier:{background:"Renowned chef, 7yr Harmon events.",associates:"Kitchen staff",record:"Obstruction 2019",financials:"Restaurant struggling"},
       timeline:[{t:"6:00pm",a:"Setup"},{t:"11:00pm",a:"Kitchen — confirmed"},{t:"12:00am",a:"Still in kitchen"}],
       fingerprint:"loop",uvClue:"Nothing unusual detected"},
    ],
    clues:[
      {id:"c1",name:"Cyanide Residue",desc:"Found only in victim's flute — targeted, not accidental.",critical:true,room:"Rooftop Bar",found:false,hasFingerprint:true,hasUV:true},
      {id:"c2",name:"Broken Nail Fragment",desc:"Acrylic nail near drink station. Matched to Diana's missing thumbnail.",critical:true,room:"Rooftop Bar",found:false,hasFingerprint:true,hasUV:false},
      {id:"c3",name:"Deleted Calendar Entry",desc:"Victor's phone: deleted meeting 'D.V. — severance terms' for tomorrow.",critical:false,room:"Victim's Suite",found:false,hasFingerprint:false,hasUV:false},
      {id:"c4",name:"Security Camera Gap",desc:"Footage 11:43-11:47pm near bar was manually looped.",critical:false,room:"Security Office",found:false,hasFingerprint:false,hasUV:false},
      {id:"c5",name:"Bar Receipt",desc:"Marcus ordered 6 whiskeys 10pm-midnight. Alibi airtight.",critical:false,room:"VIP Lounge",found:false,hasFingerprint:false,hasUV:false},
      {id:"c6",name:"Valet Log",desc:"Elena's car left 11:15pm — 35 min before time of death.",critical:false,room:"Kitchen Entrance",found:false,hasFingerprint:false,hasUV:false},
    ],
    rooms:["Rooftop Bar","VIP Lounge","Kitchen Entrance","Security Office","Victim's Suite"],
    witnesses:[
      {id:"w1",name:"Jake Torres",role:"Head Bartender",avatar:"🧑‍🍳",summary:"Worked the bar all night. Saw something he didn't report.",
       statements:[
         {trigger:"general",text:"Mr. Harmon seemed fine early on. But around 11:30pm I noticed Diana at the far end just watching him. Not ordering anything."},
         {trigger:"diana",text:"Diana was here — but not the whole time. I stepped away around 11:40 to restock. When I came back she was at the bar again but her hands were shaking."},
         {trigger:"suspicious",text:"After the police arrived I found a small glass vial under the bar mat. It smelled like bitter almonds. I still have it."},
       ]},
      {id:"w2",name:"Clara Huang",role:"Event Photographer",avatar:"📸",summary:"Shot the whole event with a long lens. People forget she's there.",
       statements:[
         {trigger:"general",text:"Diana was composed all night until about 11:35. She checked her phone and her expression went completely cold."},
         {trigger:"diana",text:"I have a photo timestamped 11:44pm of Diana near the drink station. Her arm is clearly reaching toward the bar."},
         {trigger:"camera",text:"Whoever looped the security footage didn't know about my SD card backup. I still have those four minutes."},
       ]},
    ],
    interrogationQuestions:{
      diana:[{q:"Where exactly were you between 11:40 and 11:50pm?"},{q:"We found a nail fragment near the champagne — is that yours?"},{q:"When did you last speak privately with Victor today?"}],
      marcus:[{q:"How much debt are you carrying right now?"},{q:"Did you know your father was changing the will?"}],
    },
    reverseInterrogation:{
      alibi:"I was reviewing crime scene photographs and interviewing catering staff.",
      secret:"You arrived 20 minutes late and used the service entrance.",
      questions:["Your sign-in shows you used the service entrance tonight — same door the killer likely used. Explain that.","We found your fingerprints on the victim's glass. Why touch key evidence without gloves?","A witness says you argued with the victim three weeks ago. What was that about?","You took 20 minutes longer than protocol to secure the scene. What were you doing?"],
    },
    crossExam:{
      diana:{contradiction:"Diana claims she was at the bar all night — but the camera gap is 11:43-11:47pm, exactly when she says she was standing there.",pressure:"the nail fragment and camera gap",threshold:2},
      marcus:{contradiction:"Marcus says the inheritance timing was terrible — yet he met with an estate lawyer two weeks ago.",pressure:"secret lawyer meetings",threshold:3},
    },
    cctv:"11:43pm — CAMERA OFFLINE. Last frame: Diana at bar end, hand extending toward champagne station. Glove visible on right hand. Duration: 4 minutes, 12 seconds. Manual loop detected on footage — internal system access required.",
  },
  {
    id:"museum",title:"The Missing Vermeer",setting:"City Modern Art Museum — 2am",
    badge:"🎨",difficulty:"hard",
    summary:"A priceless Vermeer disappeared during a gala opening. The motion sensors never triggered.",
    victim:"Girl with a Pearl Earring II — estimated $80M",
    cause:"Inside job — master sensor override, 4-minute window",
    killer:"Noah Park",
    killerReason:"Noah was approached by a private collector 3 months ago. He disabled sensors during a gap between guard rotations and called in the theft himself.",
    narratorIntro:"They say art is eternal. Tonight $80 million worth of eternity walked out the front door. Somebody in this building knew exactly when to move.",
    polaroids:[
      {id:"p1",label:"Empty Frame",caption:"Painting removed cleanly — no glass shards, no alarm triggered.",emoji:"🖼"},
      {id:"p2",label:"Sensor Terminal",caption:"Override logged at 11:58pm. Single credential used.",emoji:"💻"},
      {id:"p3",label:"Loading Dock",caption:"Tire tracks consistent with panel van. Fresh oil stain.",emoji:"🚐"},
    ],
    suspects:[
      {id:"noah",name:"Noah Park",role:"Head of Security",age:38,avatar:"👮",guilty:true,
       alibi:"Claims he was on his scheduled patrol rounds",secret:"Offshore accounts with three unexplained deposits",
       psych:{archetype:"The Trusted Insider",traits:["Disciplined facade","Financially desperate","Rehearsed calm"],tell:"Becomes hyper-precise about timings — too rehearsed"},
       dossier:{background:"15yr security veteran. Former police. IA probe 2019.",associates:"Private collectors, offshore broker",record:"IA investigation — no charges",financials:"Salary $62k. Offshore: $220k unaccounted"},
       timeline:[{t:"8:00pm",a:"Started shift"},{t:"11:50pm",a:"Near sensor terminal"},{t:"11:54pm",a:"4-min sensor disable"},{t:"12:05am",a:"Reported theft himself"}],
       fingerprint:"whorl",uvClue:"UV ink from sensor terminal keypad found on Noah's right thumb"},
      {id:"curator",name:"Dr. Sofia Chen",role:"Lead Curator",age:51,avatar:"👩‍🎨",guilty:false,
       alibi:"At gala dinner — 8 witnesses",secret:"Forged authentication papers 2022",
       psych:{archetype:"The Reputation Protector",traits:["Intellectual","Proud","Scandal-averse"],tell:"Changes subject rapidly when forgery comes up"},
       dossier:{background:"20yr museum veteran.",associates:"Art world, auction houses",record:"None",financials:"$110k — clean"},
       timeline:[{t:"7:00pm",a:"Gala setup"},{t:"9:00pm",a:"Donor dinner — 8 witnesses"},{t:"12:10am",a:"First on scene"}],
       fingerprint:"loop",uvClue:"Nothing unusual detected"},
      {id:"restorer",name:"Kai Brennan",role:"Art Restorer",age:29,avatar:"🎨",guilty:false,
       alibi:"Left at 10pm — badge confirmed",secret:"Has skills to replicate masterworks",
       psych:{archetype:"The Misunderstood Prodigy",traits:["Introverted","Defensive about abilities","Honest to a fault"],tell:"Makes eye contact only when speaking the truth"},
       dossier:{background:"Prodigy restorer, known copier.",associates:"Private galleries",record:"None",financials:"Freelance"},
       timeline:[{t:"10:07pm",a:"Badge exit — 2hrs before theft"}],
       fingerprint:"arch",uvClue:"Nothing unusual detected"},
      {id:"patron",name:"Vivienne Lau",role:"Major Donor",age:63,avatar:"👩‍💼",guilty:false,
       alibi:"At table until midnight — 4 witnesses",secret:"Tried to buy this painting for 5 years",
       psych:{archetype:"The Obsessed Collector",traits:["Possessive","Indirect","Plays long games"],tell:"Asks questions back when she feels cornered"},
       dossier:{background:"Billionaire collector. $4M offer declined.",associates:"Art brokers",record:"None",financials:"$1.2B net worth"},
       timeline:[{t:"7:00pm",a:"Arrived"},{t:"11:45pm",a:"Still at table"}],
       fingerprint:"loop",uvClue:"Nothing unusual detected"},
    ],
    clues:[
      {id:"c1",name:"Sensor Override Log",desc:"4-min disable at 11:58pm. Only Noah's credentials authorized.",critical:true,room:"Security Center",found:false,hasFingerprint:true,hasUV:true},
      {id:"c2",name:"Offshore Wire Transfer",desc:"$180k to Noah's account from shell company — 72hrs post-theft.",critical:true,room:"Security Center",found:false,hasFingerprint:false,hasUV:false},
      {id:"c3",name:"Replica Canvas",desc:"Blank canvas matching Vermeer's exact dimensions in Noah's locker.",critical:false,room:"Storage Vault",found:false,hasFingerprint:true,hasUV:false},
      {id:"c4",name:"Sofia's Forgery File",desc:"Not connected to theft — damages her credibility.",critical:false,room:"Restorer's Workshop",found:false,hasFingerprint:false,hasUV:false},
      {id:"c5",name:"Kai's Exit Badge",desc:"Confirmed exit 10:07pm — 2hrs before theft.",critical:false,room:"Gallery Hall A",found:false,hasFingerprint:false,hasUV:false},
      {id:"c6",name:"Vivienne's Offer Letter",desc:"$4M private offer, declined 3 years ago.",critical:false,room:"Donor Lounge",found:false,hasFingerprint:false,hasUV:false},
    ],
    rooms:["Gallery Hall A","Security Center","Storage Vault","Restorer's Workshop","Donor Lounge"],
    witnesses:[
      {id:"w1",name:"Officer Ray Chen",role:"Junior Guard",avatar:"👮",summary:"On patrol. Noah sent him on an unexplained break.",
       statements:[
         {trigger:"general",text:"Noah told me to take a 20-minute break at 11:45. That never happens — he's always strict about rotation."},
         {trigger:"noah",text:"I saw Noah near the sensor terminal around 11:50. He said it was a diagnostic. The timeline matches exactly when the sensors went offline."},
         {trigger:"suspicious",text:"After the theft was reported, Noah was the calmest person in the building. In five years I've never seen him calm during an incident."},
       ]},
    ],
    interrogationQuestions:{
      noah:[{q:"Walk me through your exact location at 11:50pm."},{q:"Someone used your credentials to disable the sensors."},{q:"$180,000 appeared in your account 72 hours after the theft."}],
      curator:[{q:"Tell me about the forged authentication certificate from 2022."},{q:"Did you notice anything unusual about Noah tonight?"}],
    },
    reverseInterrogation:{
      alibi:"I was called in after the fact — not on duty when it occurred.",
      secret:"Your precinct received $50k from the museum foundation last month.",
      questions:["Your precinct received $50,000 from the museum foundation last month. Doesn't that compromise you?","You were seen dining with Vivienne Lau two weeks before the heist.","Your file shows you cleared Noah Park in a prior incident.","Three art theft cases this year — all unsolved. Why?"],
    },
    crossExam:{
      noah:{contradiction:"Noah says his keycard was stolen — but access logs show it at his personal locker 40 minutes before the theft.",pressure:"the locker access timestamp",threshold:2},
      curator:{contradiction:"Sofia says she had no idea about the forgery file — but her signature is on the cover page.",pressure:"the signature",threshold:3},
    },
    cctv:"11:58pm — SENSOR GRID OFFLINE. Last frame: Noah Park at terminal C-7, credential badge visible. Duration: 4 minutes 03 seconds. Painting removed during blackout. Footage of loading dock shows unregistered vehicle departing 12:02am.",
  },
  {
    id:"starfall",title:"Death on the Starfall Express",setting:"Luxury Train — Swiss Alps, 3am",
    badge:"🚂",difficulty:"easy",
    summary:"A renowned toxicologist found dead in his private sleeper car. The train never stopped. The killer is still on board.",
    victim:"Dr. Elliot Marsh, 59 — Nobel-nominated toxicologist",
    cause:"Rare synthetic poison — self-synthesized compound, untraceable commercially",
    killer:"Sera Vantini",
    killerReason:"Sera is a pharmaceutical investigator Dr. Marsh had been secretly blackmailing for 6 years over a falsified clinical trial. She synthesized the poison from compounds she smuggled in her cosmetics bag.",
    narratorIntro:"The Starfall Express cuts through the dark Alps like a whisper. Dr. Marsh won't see Geneva. The killer sits three cars away, watching the snowflakes disappear against the window.",
    polaroids:[
      {id:"p1",label:"Marsh's Cabin",caption:"Water glass at bedside. Faint discolouration at bottom. Compound synthesized on-site.",emoji:"🥛"},
      {id:"p2",label:"Corridor Camera",caption:"11:58pm — figure in dark coat moving toward rear cabins. Direction: away from galley.",emoji:"🚪"},
      {id:"p3",label:"Cosmetics Bag",caption:"Three unlabelled vials. Trace compound matches toxin in victim's glass.",emoji:"💄"},
    ],
    suspects:[
      {id:"sera",name:"Sera Vantini",role:"Pharmaceutical Investigator",age:41,avatar:"👩‍🔬",guilty:true,
       alibi:"Claims she was in the dining car until midnight",secret:"Carried undeclared chemical compounds in her luggage",
       psych:{archetype:"The Long-Suffering Avenger",traits:["Controlled","Highly intelligent","Suppressed rage beneath charm"],tell:"Over-smiles when discussing the victim — compensating"},
       dossier:{background:"Senior investigator at EuroPharma. 6yr blackmail victim.",associates:"Pharmaceutical board members",record:"Clean",financials:"$180k salary, but $200k paid out to Marsh over 6 years"},
       timeline:[{t:"8:00pm",a:"Boarded in Zurich"},{t:"10:30pm",a:"Dining car — confirmed by steward"},{t:"11:55pm",a:"Returned to cabin"},{t:"12:08am",a:"GAP — 13 minutes"},{t:"12:21am",a:"Seen in corridor near Marsh's cabin"}],
       fingerprint:"loop",uvClue:"Synthetic compound traces on Sera's fingertips — matches toxin profile"},
      {id:"brutus",name:"Brutus Kaine",role:"Defense Attorney",age:54,avatar:"👨‍⚖️",guilty:false,
       alibi:"Drinking in the bar until 1am — barman confirms",secret:"Represents three clients currently in litigation with Marsh",
       psych:{archetype:"The Professional Predator",traits:["Aggressive","Territorial","Charming to allies"],tell:"Taps finger three times before deflecting"},
       dossier:{background:"High-profile defense attorney. Anti-Marsh for professional reasons.",associates:"Pharma litigation clients",record:"Disbarment threat 2018 — resolved",financials:"$400k/yr — clean"},
       timeline:[{t:"8:00pm",a:"Boarded — argued with Marsh at station"},{t:"10:00pm",a:"Bar car — 3 witnesses"},{t:"1:10am",a:"Retired to cabin"}],
       fingerprint:"whorl",uvClue:"Nothing unusual detected"},
      {id:"helena",name:"Helena Cross",role:"Science Journalist",age:33,avatar:"✍️",guilty:false,
       alibi:"In her cabin writing — no witness",secret:"Working on exposé about Marsh's falsified trials",
       psych:{archetype:"The Righteous Crusader",traits:["Tenacious","Fearless","Morally rigid"],tell:"Asks clarifying questions as deflection tactic"},
       dossier:{background:"Award-winning science writer. Shadowing Marsh for interview.",associates:"Media contacts, whistleblowers",record:"None",financials:"$65k — tight"},
       timeline:[{t:"8:00pm",a:"Boarded"},{t:"9:00pm",a:"Interview with Marsh — heated"},{t:"11:00pm",a:"In cabin — unverified"},{t:"2:00am",a:"Discovered body — first on scene"}],
       fingerprint:"arch",uvClue:"Nothing unusual detected"},
      {id:"conductor",name:"Franz Brandt",role:"Senior Conductor",age:48,avatar:"🧑‍✈️",guilty:false,
       alibi:"Checked on every car at midnight — 2 staff witnesses",secret:"Accepted a large cash tip from Marsh to keep 'privacy'",
       psych:{archetype:"The Complicit Bystander",traits:["Rule-follower with exceptions","Loyal to money","Anxious about exposure"],tell:"Refers to protocol obsessively when nervous"},
       dossier:{background:"17yr train veteran. Spotless record except this run.",associates:"Railway management",record:"None",financials:"$52k salary + undeclared cash"},
       timeline:[{t:"8:00pm",a:"Departure — standard duties"},{t:"12:00am",a:"Car inspection — 2 staff present"},{t:"12:30am",a:"Received tip from Marsh's cabin"},{t:"2:05am",a:"Responded to Helena's distress signal"}],
       fingerprint:"loop",uvClue:"Nothing unusual detected"},
    ],
    clues:[
      {id:"c1",name:"Poison Residue",desc:"Synthetic compound in Marsh's water glass. Not commercially available — home-synthesized.",critical:true,room:"Marsh's Sleeper",found:false,hasFingerprint:true,hasUV:true},
      {id:"c2",name:"Cosmetics Vial",desc:"Hidden vial in Sera's travel kit — traces match compound found in victim's glass.",critical:true,room:"Sera's Cabin",found:false,hasFingerprint:true,hasUV:true},
      {id:"c3",name:"Blackmail Ledger",desc:"Encrypted file on Marsh's laptop: 6 years of payments from S.V. totaling $200k.",critical:false,room:"Marsh's Sleeper",found:false,hasFingerprint:false,hasUV:false},
      {id:"c4",name:"Corridor Cam Timestamp",desc:"Train security camera: someone in dark coat near Marsh's door 12:08-12:21am.",critical:false,room:"Train Corridor",found:false,hasFingerprint:false,hasUV:false},
      {id:"c5",name:"Kaine's Briefcase",desc:"Litigation files against Marsh — sealed and old. Not operational motive.",critical:false,room:"Bar Car",found:false,hasFingerprint:false,hasUV:false},
      {id:"c6",name:"Helena's Notes Draft",desc:"Draft exposé on falsified trials — names Marsh but also Sera as victim, not perpetrator.",critical:false,room:"Helena's Cabin",found:false,hasFingerprint:false,hasUV:false},
    ],
    rooms:["Marsh's Sleeper","Sera's Cabin","Helena's Cabin","Bar Car","Train Corridor"],
    witnesses:[
      {id:"w1",name:"Milos",role:"Night Steward",avatar:"🧑‍🍽️",summary:"Worked the corridor all night. Quiet, observant, eager to please.",
       statements:[
         {trigger:"general",text:"Very quiet night. Only Ms. Vantini was in the corridor after midnight — she said she needed water. But the galley is the other direction."},
         {trigger:"sera",text:"She seemed perfectly composed but her hands were cold when she took the water glass from me. Like ice. It stuck with me."},
         {trigger:"suspicious",text:"When I cleaned Marsh's cabin this morning I noticed his water glass had already been wiped. I hadn't done it. Someone cleaned it before I got there."},
       ]},
    ],
    interrogationQuestions:{
      sera:[{q:"You were seen near Dr. Marsh's cabin just after midnight — explain that."},{q:"What exactly is in the unlabeled vials in your travel kit?"},{q:"How long had Dr. Marsh been blackmailing you?"}],
      brutus:[{q:"You argued with Marsh at the platform. What about?"},{q:"Tell me about the three clients currently suing Marsh."}],
      helena:[{q:"You were first on scene. Walk me through finding the body."},{q:"Your exposé — does it mention anyone else on this train?"}],
    },
    reverseInterrogation:{
      alibi:"I was coordinating with the railway authority and reviewing passenger manifests.",
      secret:"You share a professional contact with two of the passengers.",
      questions:["Your contact log shows you called the victim's assistant the day before boarding. Why?","How did you know which cabin to check first?","A passenger says they saw you entering the rear of the train without logging it.","You cleared Kaine as a suspect very quickly. Is that impartial?"],
    },
    crossExam:{
      sera:{contradiction:"Sera claims she was getting water — but the galley is forward, and the camera shows her moving toward the rear where Marsh slept.",pressure:"the direction she was walking",threshold:2},
      helena:{contradiction:"Helena says she discovered the body by chance — but her notes reference 'final confrontation' hours before the death.",pressure:"the pre-written notes",threshold:3},
    },
    cctv:"12:08am — CORRIDOR CAM ACTIVE. Figure in dark coat (height ~5'6\", feminine build) moves from cabin 4 toward rear. Duration of absence: 13 minutes. Returns 12:21am. Galley confirmed: forward direction. Figure moved: rear direction. Inconsistent with stated reason.",
  },
];

// ============================================================
// CSS
// ============================================================
const css=`
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Playfair+Display:ital@1&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{background:#06080C;color:#EDE9E0;font-family:'Inter',sans-serif;min-height:100vh;overflow-x:hidden;}
body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:0.025;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:128px 128px;}
::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:#0A0C12;}::-webkit-scrollbar-thumb{background:#1F2330;border-radius:2px;}::-webkit-scrollbar-thumb:hover{background:#C9AA71;}
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pinDrop{0%{opacity:0;transform:translateY(-28px) scale(0.85)}65%{transform:translateY(3px) scale(1.04)}100%{opacity:1;transform:none}}
@keyframes pulseRed{0%,100%{box-shadow:0 0 0 0 #E0302022}50%{box-shadow:0 0 28px 6px #E0302044}}
@keyframes scanline{from{transform:translateY(0)}to{transform:translateY(100vh)}}
@keyframes breathe{0%,100%{opacity:0.6}50%{opacity:1}}
@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
@keyframes crackFlash{0%{background:#E0302000}50%{background:#E0302018}100%{background:#E0302000}}
@keyframes tickerScroll{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
@keyframes urgencyPulse{0%,100%{opacity:1}50%{opacity:0.4}}
@keyframes uvGlow{0%,100%{box-shadow:0 0 0 0 #A020F000}50%{box-shadow:0 0 24px 6px #A020F055}}
@keyframes scanMove{from{transform:translateY(0)}to{transform:translateY(100%)}}
@keyframes polaroidDrop{0%{opacity:0;transform:translateY(-20px) rotate(-2deg)}100%{opacity:1;transform:none}}
@keyframes mapPing{0%{transform:scale(1);opacity:0.8}100%{transform:scale(2.2);opacity:0}}
.anim-up{animation:fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;}
.anim-in{animation:fadeIn 0.35s ease both;}
.anim-pin{animation:pinDrop 0.55s cubic-bezier(0.34,1.56,0.64,1) both;}
.anim-slide{animation:slideIn 0.4s cubic-bezier(0.16,1,0.3,1) both;}
.display{font-family:'Bebas Neue',sans-serif;letter-spacing:0.04em;line-height:0.92;}
.mono{font-family:'JetBrains Mono',monospace;}
.noir{font-family:'Playfair Display',serif;font-style:italic;}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 17px;border-radius:3px;font-family:'Inter',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.15s;border:1px solid transparent;letter-spacing:0.08em;text-transform:uppercase;white-space:nowrap;}
.btn:disabled{opacity:0.28;cursor:not-allowed;pointer-events:none;}
.btn-gold{background:#C9AA7114;border-color:#C9AA7150;color:#C9AA71;}.btn-gold:hover{background:#C9AA7124;border-color:#C9AA71;box-shadow:0 0 20px #C9AA7128;}
.btn-red{background:#E0302014;border-color:#E0302050;color:#E03020;}.btn-red:hover{background:#E0302024;border-color:#E03020;}
.btn-teal{background:#22D4B414;border-color:#22D4B450;color:#22D4B4;}.btn-teal:hover{background:#22D4B424;border-color:#22D4B4;box-shadow:0 0 20px #22D4B428;}
.btn-purple{background:#9B7FD414;border-color:#9B7FD450;color:#9B7FD4;}.btn-purple:hover{background:#9B7FD424;border-color:#9B7FD4;}
.btn-green{background:#30D46A14;border-color:#30D46A50;color:#30D46A;}.btn-green:hover{background:#30D46A24;border-color:#30D46A;}
.btn-ghost{background:transparent;border-color:#1F2330;color:#8A8FA8;}.btn-ghost:hover{border-color:#8A8FA8;color:#EDE9E0;}
.btn-amber{background:#F0A02014;border-color:#F0A02050;color:#F0A020;}.btn-amber:hover{background:#F0A02024;border-color:#F0A020;}
.btn-sm{padding:6px 12px;font-size:10px;}.btn-lg{padding:13px 32px;font-size:14px;}.btn-xl{padding:17px 44px;font-size:15px;}
.card{background:#0A0C12;border:1px solid #1F2330;border-radius:4px;transition:border-color 0.2s;}
.card-gold{border-color:#C9AA7140;}.card-red{border-color:#E0302040;}.card-teal{border-color:#22D4B440;}.card-purple{border-color:#9B7FD440;}.card-amber{border-color:#F0A02040;}
.tag{display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:2px;font-size:9px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;}
.tag-gold{background:#C9AA7110;color:#C9AA71;border:1px solid #C9AA7124;}.tag-red{background:#E0302010;color:#E03020;border:1px solid #E0302024;}
.tag-teal{background:#22D4B410;color:#22D4B4;border:1px solid #22D4B424;}.tag-purple{background:#9B7FD410;color:#9B7FD4;border:1px solid #9B7FD424;}
.tag-green{background:#30D46A10;color:#30D46A;border:1px solid #30D46A24;}.tag-muted{background:#1F233010;color:#42475A;border:1px solid #1F233030;}
.tag-amber{background:#F0A02010;color:#F0A020;border:1px solid #F0A02024;}
.input{background:#10131A;border:1px solid #1F2330;border-radius:3px;padding:10px 14px;color:#EDE9E0;font-family:'Inter',sans-serif;font-size:14px;width:100%;outline:none;transition:border-color 0.15s;}
.input:focus{border-color:#22D4B4;box-shadow:0 0 0 3px #22D4B40C;}
.input::placeholder{color:#42475A;}
textarea.input{resize:vertical;min-height:80px;line-height:1.65;}
.spinner{width:14px;height:14px;border:2px solid #1F2330;border-top-color:#22D4B4;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;flex-shrink:0;}
.label{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#42475A;}
.bar-track{height:3px;background:#1F2330;border-radius:2px;overflow:hidden;}
.bar-fill{height:100%;border-radius:2px;transition:width 0.5s ease;}
.susp-track{height:6px;background:#1F2330;border-radius:3px;overflow:hidden;}
.susp-fill{height:100%;border-radius:3px;transition:width 0.6s cubic-bezier(0.34,1.56,0.64,1);}
.overlay{position:fixed;inset:0;background:#06080CEE;backdrop-filter:blur(16px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;}
.modal{background:#0A0C12;border:1px solid #1F2330;border-radius:6px;padding:28px;max-width:680px;width:100%;max-height:90vh;overflow-y:auto;animation:fadeUp 0.25s ease;}
.modal-wide{max-width:960px;}
.top-nav{position:sticky;top:0;z-index:100;background:#06080CF4;backdrop-filter:blur(28px);border-bottom:1px solid #1F2330;padding:0 24px;display:flex;align-items:center;justify-content:space-between;gap:12px;height:54px;}
.bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:100;background:#06080CF8;backdrop-filter:blur(20px);border-top:1px solid #1F2330;display:flex;align-items:center;justify-content:space-around;height:62px;padding:0 8px;}
.bnav-item{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:8px 14px;border-radius:4px;transition:all 0.15s;min-width:54px;}
.bnav-item.active{background:#22D4B40E;}
.bnav-icon{font-size:20px;line-height:1;}
.bnav-label{font-size:9px;letter-spacing:0.1em;font-family:'JetBrains Mono',monospace;text-transform:uppercase;color:#42475A;transition:color 0.15s;}
.bnav-item.active .bnav-label{color:#22D4B4;}
.player-chip{display:flex;align-items:center;gap:7px;padding:4px 11px;background:#10131A;border:1px solid #1F2330;border-radius:16px;font-size:12px;cursor:pointer;transition:all 0.15s;}
.toggle{width:38px;height:21px;border-radius:11px;cursor:pointer;position:relative;transition:all 0.2s;flex-shrink:0;}
.toggle-knob{width:15px;height:15px;border-radius:50%;background:white;position:absolute;top:3px;transition:left 0.2s;}
.portrait-card{background:#0A0C12;border:1px solid #1F2330;border-radius:4px;cursor:pointer;transition:all 0.15s;overflow:hidden;}
.portrait-card:hover{border-color:#42475A;}
.portrait-card.selected{border-color:#22D4B4;background:#22D4B408;}
.portrait-card.cracked{border-color:#E03020;animation:crackFlash 0.5s ease;}
.portrait-card.lawyered{border-color:#9B7FD4;opacity:0.7;}
.portrait-avatar{display:flex;align-items:center;justify-content:center;background:#10131A;border-bottom:1px solid #1F2330;}
.portrait-body{padding:12px 14px;}
.portrait-name{font-family:'Bebas Neue',sans-serif;letter-spacing:0.04em;color:#EDE9E0;}
.portrait-role{font-size:11px;color:#8A8FA8;margin-top:2px;}
.bubble{max-width:85%;padding:10px 14px;border-radius:4px;font-size:13px;line-height:1.65;border:1px solid transparent;}
.bubble-user{background:#22D4B40E;border-color:#22D4B428;align-self:flex-end;}
.bubble-ai{background:#10131A;border-color:#1F2330;}
.bubble-error{background:#E030200E;border-color:#E0302028;color:#E03020;}
.bubble-system{background:#9B7FD40E;border-color:#9B7FD428;color:#9B7FD4;font-style:italic;}
.bubble-reverse{background:#9B7FD40E;border-color:#9B7FD428;}
.bubble-pressure{background:#E030200E;border-color:#E0302028;}
.bubble-backtalk{background:#F0A02010;border-color:#F0A02040;font-style:italic;}
.corkboard{background:#1A1208;border:1px solid #2A1E10;border-radius:6px;padding:24px;min-height:340px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='0.8' fill='%23C9AA7112'/%3E%3C/svg%3E");background-size:40px 40px;}
.cork-note{background:#F5EDD0;border-radius:2px;padding:14px 12px 12px;position:relative;cursor:pointer;box-shadow:0 3px 14px rgba(0,0,0,0.55),0 1px 3px rgba(0,0,0,0.3);transition:transform 0.15s,box-shadow 0.15s;min-height:100px;}
.cork-note:hover{transform:translateY(-3px) rotate(0.5deg);box-shadow:0 8px 24px rgba(0,0,0,0.6);}
.cork-note.unknown{background:#2A2418;cursor:pointer;}
.cork-note.unknown:hover{transform:translateY(-2px);}
.cork-note.critical::after{content:'';position:absolute;inset:0;border-radius:2px;border:2px solid #C9AA71;pointer-events:none;}
.cork-note-title{font-weight:700;font-size:12px;color:#1A1208;margin-bottom:5px;font-family:'Inter',sans-serif;}
.cork-note-body{font-size:11px;color:#3A3020;line-height:1.55;}
.cork-stamp{position:absolute;top:6px;right:8px;font-size:8px;font-weight:900;letter-spacing:0.15em;color:#8A6510;opacity:0.7;font-family:'JetBrains Mono',monospace;text-transform:uppercase;}
.forensics-panel{background:#0A1A14;border:1px solid #22D4B430;border-radius:3px;padding:10px 12px;}
.evidence-thread{position:relative;padding-left:20px;}
.evidence-thread::before{content:'';position:absolute;left:7px;top:0;bottom:0;width:1px;background:linear-gradient(to bottom,#C9AA7100,#C9AA7160,#C9AA7100);}
.thread-node{position:absolute;left:3px;width:9px;height:9px;border-radius:50%;border:2px solid #06080C;}
.witness-item{background:#0A0C12;border:1px solid #1F2330;border-radius:4px;padding:14px;cursor:pointer;transition:all 0.15s;}
.witness-item:hover{border-color:#42475A;}
.witness-item.selected{border-color:#22D4B4;background:#22D4B408;}
.diff-card{background:#10131A;border:1px solid #1F2330;border-radius:4px;padding:16px;cursor:pointer;transition:all 0.15s;text-align:center;}
.diff-card:hover{border-color:#42475A;}
.diff-card.selected{border-color:#C9AA71;background:#C9AA7108;}
.model-row{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:4px;border:1px solid #1F2330;cursor:pointer;transition:all 0.15s;background:#10131A;}
.model-row:hover{border-color:#42475A;}
.model-row.active{border-color:#22D4B4;background:#22D4B408;}
.tactic-card{background:#10131A;border:1px solid #1F2330;border-radius:4px;padding:12px 14px;cursor:pointer;transition:all 0.15s;}
.tactic-card:hover{border-color:#42475A;}
.tactic-card.selected{border-color:#E03020;background:#E030200E;}
.accuse-card{background:#10131A;border:1px solid #1F2330;border-radius:4px;padding:14px 16px;cursor:pointer;transition:all 0.15s;}
.accuse-card:hover{border-color:#E0302060;}
.accuse-card.selected{border-color:#E03020;background:#E030200E;}
.narrator-bar{background:#06080C;border-bottom:1px solid #1F2330;padding:8px 24px;overflow:hidden;}
.narrator-text{font-family:'Playfair Display',serif;font-style:italic;font-size:13px;color:#8A8FA8;letter-spacing:0.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.timer-display{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;padding:4px 12px;border-radius:3px;background:#10131A;border:1px solid #1F2330;letter-spacing:0.08em;}
.timer-display.warning{color:#F0A020;border-color:#F0A02040;background:#F0A02010;}
.timer-display.critical{color:#E03020;border-color:#E0302040;background:#E0302010;animation:pulseRed 1s infinite;}
.psych-card{background:#0A0C12;border:1px solid #9B7FD440;border-radius:4px;padding:14px 16px;margin-top:12px;}
.notes-panel{background:#06080C;border:1px solid #1F2330;border-radius:4px;padding:0;}
.notes-header{padding:10px 14px;border-bottom:1px solid #1F2330;display:flex;align-items:center;gap:8px;}
.notes-body{padding:12px 14px;}
.note-entry{background:#10131A;border:1px solid #1F2330;border-radius:3px;padding:10px 12px;margin-bottom:8px;font-size:12px;line-height:1.6;color:#8A8FA8;}
.note-entry .note-time{font-family:'JetBrains Mono',monospace;font-size:9px;color:#42475A;margin-bottom:4px;}
.pulse-red{animation:pulseRed 1s infinite;}
.sidebar-section{margin-bottom:20px;}
.sidebar-section-title{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#42475A;padding:0 0 8px 0;border-bottom:1px solid #1F2330;margin-bottom:12px;}
.splash-bg{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#06080C;overflow:hidden;}
.splash-scanline{position:absolute;width:100%;height:2px;background:linear-gradient(90deg,transparent,#22D4B414,transparent);animation:scanline 3s linear infinite;pointer-events:none;}
.splash-grid{position:absolute;inset:0;background-image:linear-gradient(#1F233010 1px,transparent 1px),linear-gradient(90deg,#1F233010 1px,transparent 1px);background-size:40px 40px;pointer-events:none;}
.case-select-card{background:#0A0C12;border:1px solid #1F2330;border-radius:4px;padding:16px;cursor:pointer;transition:all 0.2s;position:relative;overflow:hidden;}
.case-select-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent;transition:background 0.15s;}
.case-select-card:hover{border-color:#42475A;transform:translateY(-1px);}
.case-select-card.selected{border-color:#C9AA71;}
.case-select-card.selected::before{background:#C9AA71;}
.profiler-trait{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;background:#9B7FD410;border:1px solid #9B7FD428;border-radius:2px;font-size:10px;color:#9B7FD4;font-family:'JetBrains Mono',monospace;letter-spacing:0.08em;}
.verdict-bg{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;}

/* NEWS TICKER */
.news-ticker-wrap{overflow:hidden;border-bottom:1px solid #1F2330;height:28px;display:flex;align-items:center;position:relative;}
.news-ticker-inner{display:flex;align-items:center;white-space:nowrap;animation:tickerScroll 28s linear infinite;}
.news-ticker-inner.urgent{animation-duration:18s;}
.news-ticker-inner.critical-speed{animation-duration:10s;}
.ticker-badge{flex-shrink:0;padding:2px 10px;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;margin-right:16px;}
.ticker-item{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.08em;padding:0 24px;border-right:1px solid;}

/* FINGERPRINT MINIGAME */
.fp-canvas{position:relative;width:200px;height:200px;border-radius:50%;overflow:hidden;cursor:crosshair;border:2px solid #1F2330;background:#06080C;user-select:none;}
.fp-scan-line{position:absolute;width:100%;height:3px;background:linear-gradient(90deg,transparent,#22D4B480,transparent);pointer-events:none;}
.fp-match-card{background:#10131A;border:1px solid #1F2330;border-radius:4px;padding:12px;cursor:pointer;transition:all 0.15s;text-align:center;}
.fp-match-card:hover{border-color:#42475A;}
.fp-match-card.matched{border-color:#30D46A;background:#30D46A10;}
.fp-match-card.wrong{border-color:#E03020;background:#E0302010;animation:pulseRed 0.4s ease;}

/* UV LIGHT MINIGAME */
.uv-surface{position:relative;overflow:hidden;border-radius:4px;cursor:none;user-select:none;}
.uv-torch{position:absolute;width:120px;height:120px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#A020F044 0%,#A020F022 40%,transparent 70%);transition:opacity 0.1s;}
.uv-revealed{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:#A020F0;text-align:center;padding:20px;opacity:0;transition:opacity 0.3s;pointer-events:none;text-shadow:0 0 20px #A020F0,0 0 40px #A020F0;}

/* SCENE MAP */
.scene-map-room{cursor:pointer;transition:all 0.2s;rx:4;ry:4;}
.scene-map-room:hover{filter:brightness(1.4);}
.scene-map-room.active{filter:brightness(1.6);}
.map-ping{animation:mapPing 1s ease-out forwards;}

/* POLAROID */
.polaroid{background:#F5F0E8;padding:12px 12px 32px;box-shadow:0 4px 20px rgba(0,0,0,0.6),0 1px 4px rgba(0,0,0,0.4);transform-origin:center;transition:transform 0.2s;cursor:pointer;animation:polaroidDrop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;}
.polaroid:hover{transform:scale(1.04) rotate(1deg);}
.polaroid-inner{width:140px;height:100px;background:#1A1A1A;display:flex;align-items:center;justify-content:center;margin-bottom:10px;overflow:hidden;border:1px solid #0A0A0A;}
.polaroid-caption{font-family:'Inter',sans-serif;font-size:9px;color:#3A3020;text-align:center;line-height:1.4;font-style:italic;}

/* CCTV */
.cctv-panel{background:#000;border:2px solid #1F2330;border-radius:4px;padding:16px;font-family:'JetBrains Mono',monospace;position:relative;overflow:hidden;}
.cctv-panel::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,0,0.015) 2px,rgba(0,255,0,0.015) 4px);pointer-events:none;}
.cctv-text{color:#00FF41;font-size:11px;line-height:1.8;text-shadow:0 0 8px #00FF4188;}
.cctv-cursor{display:inline-block;width:8px;height:13px;background:#00FF41;margin-left:2px;animation:urgencyPulse 0.8s infinite;}

/* PRESSURE EVENT */
.pressure-event{position:fixed;top:70px;right:20px;z-index:150;max-width:320px;background:#0A0C12;border:1px solid #E0302060;border-radius:4px;padding:14px 16px;box-shadow:0 8px 32px rgba(224,48,32,0.3);animation:fadeUp 0.3s ease;}
`;

// ============================================================
// SMALL COMPONENTS
// ============================================================
function Lbl({children,style}){return<div className="label" style={style}>{children}</div>;}
function Toggle({on,onChange}){
  return(
    <div className="toggle" style={{background:on?"#22D4B4":"#1F2330"}} onClick={onChange}>
      <div className="toggle-knob" style={{left:on?"20px":"3px"}}/>
    </div>
  );
}
function MoodBadge({count,guilty,patience}){
  const mood=getMood(count,guilty,patience??10);
  const m=MOODS[mood];
  return<span className="tag" style={{background:m.color+"12",color:m.color,border:"1px solid "+m.color+"24",fontSize:9}}>{m.icon} {m.label}</span>;
}
function LieMeter({value}){
  const color=value<30?T.green:value<55?T.amber:value<75?T.orange:T.red;
  return(
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{flex:1}} className="bar-track">
        <div className="bar-fill" style={{width:value+"%",background:"linear-gradient(90deg,"+T.green+","+color+")"}}/>
      </div>
      <span className="mono" style={{fontSize:10,color,minWidth:52}}>{value}% {value<30?"honest":value<55?"evasive":value<75?"deceptive":"lying"}</span>
    </div>
  );
}
function SuspMeter({value,label}){
  const color=value<30?T.green:value<60?T.amber:value<80?T.orange:T.red;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <Lbl>{label||"Suspicion"}</Lbl>
        <span className="mono" style={{fontSize:10,color}}>{value}%</span>
      </div>
      <div className="susp-track"><div className="susp-fill" style={{width:value+"%",background:"linear-gradient(90deg,"+T.green+","+color+")"}}/></div>
    </div>
  );
}
function CaseTimer({minutes,onExpire,paused}){
  const [secs,setSecs]=useState(minutes*60);
  const ref=useRef(null);
  useEffect(()=>{
    if(paused){clearInterval(ref.current);return;}
    ref.current=setInterval(()=>setSecs(s=>{if(s<=1){clearInterval(ref.current);onExpire();return 0;}return s-1;}),1000);
    return()=>clearInterval(ref.current);
  },[paused]);
  const m=Math.floor(secs/60),s=secs%60;
  const pct=(secs/(minutes*60))*100;
  const cls=pct>40?"timer-display":pct>15?"timer-display warning":"timer-display critical";
  return<div className={cls}>{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}</div>;
}
function NarratorBar({text,loading}){
  return(
    <div className="narrator-bar">
      <div className="narrator-text">{loading?"...":(text||"The investigation continues...")}</div>
    </div>
  );
}

// ============================================================
// NEWS TICKER — Feature #21: Escalates over time, affects suspects
// ============================================================
function NewsTicker({elapsedPct,caseData,onEscalate}){
  const stage=NEWS_STAGES.slice().reverse().find(s=>elapsedPct>=s.threshold)||NEWS_STAGES[0];
  const prevStage=useRef(stage.urgency);
  useEffect(()=>{
    if(prevStage.current!==stage.urgency){
      prevStage.current=stage.urgency;
      onEscalate&&onEscalate(stage.urgency);
    }
  },[stage.urgency]);
  const color=stage.urgency==="critical"?T.red:stage.urgency==="high"?T.orange:stage.urgency==="medium"?T.amber:T.inkMut;
  const speed=stage.urgency==="critical"?"critical-speed":stage.urgency==="high"?"urgent":"";
  const headlines=[...stage.headlines,...stage.headlines];
  return(
    <div className="news-ticker-wrap" style={{background:stage.urgency==="critical"?T.red+"08":"transparent",borderBottomColor:color+"40"}}>
      <div className="ticker-badge" style={{background:color+"18",color,borderColor:color+"40",flexShrink:0,marginLeft:8}}>
        {stage.urgency==="critical"?"🚨 BREAKING":stage.urgency==="high"?"📡 URGENT":stage.urgency==="medium"?"📰 NEWS":"📡 LIVE"}
      </div>
      <div style={{flex:1,overflow:"hidden",position:"relative"}}>
        <div className={"news-ticker-inner "+speed}>
          {headlines.map((h,i)=>(
            <span key={i} className="ticker-item" style={{color,borderRightColor:color+"30"}}>
              {h} · {caseData.title} Investigation
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PRESSURE EVENT — Feature #27
// ============================================================
function PressureEvent({event,onDismiss}){
  useEffect(()=>{const t=setTimeout(onDismiss,8000);return()=>clearTimeout(t);},[]);
  return(
    <div className="pressure-event">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <span className="tag tag-red" style={{fontSize:9}}>🚨 PRESSURE EVENT</span>
        <button style={{background:"none",border:"none",color:T.inkMut,cursor:"pointer",fontSize:12}} onClick={onDismiss}>✕</button>
      </div>
      <div style={{fontSize:13,color:T.ink,lineHeight:1.6,marginBottom:6}}>{event.message}</div>
      <div style={{fontSize:11,color:T.inkMut}}>{event.effect}</div>
    </div>
  );
}

// ============================================================
// FINGERPRINT MINIGAME — Feature #16
// ============================================================
const FP_PATTERNS={
  loop:{name:"Loop Pattern",paths:["M100,60 C120,40 140,50 140,75 C140,100 120,115 100,115 C80,115 60,100 60,75 C60,50 80,40 100,60","M100,70 C115,55 130,62 130,78 C130,95 115,105 100,105 C85,105 70,95 70,78 C70,62 85,55 100,70","M100,80 C110,70 120,75 120,82 C120,90 110,95 100,95 C90,95 80,90 80,82 C80,75 90,70 100,80"]},
  whorl:{name:"Whorl Pattern",paths:["M100,60 C130,60 150,80 150,100 C150,120 130,140 100,140 C70,140 50,120 50,100 C50,80 70,60 100,60","M100,72 C122,72 138,86 138,100 C138,114 122,128 100,128 C78,128 62,114 62,100 C62,86 78,72 100,72","M100,84 C114,84 126,92 126,100 C126,108 114,116 100,116 C86,116 74,108 74,100 C74,92 86,84 100,84"]},
  arch:{name:"Arch Pattern",paths:["M40,120 C40,80 70,50 100,50 C130,50 160,80 160,120","M50,120 C50,85 72,60 100,60 C128,60 150,85 150,120","M60,120 C60,90 78,70 100,70 C122,70 140,90 140,120"]},
};

function FingerprintMinigame({clue,suspects,onMatch,onClose}){
  const canvasRef=useRef(null);
  const [scanning,setScanning]=useState(false);
  const [scanY,setScanY]=useState(0);
  const [revealed,setRevealed]=useState(false);
  const [chosen,setChosen]=useState(null);
  const [result,setResult]=useState(null);

  // Find which suspect has a print on this clue
  const correctSuspect=suspects.find(s=>s.fingerprint&&clue.hasFingerprint);
  const correctPattern=correctSuspect?.fingerprint||"loop";

  useEffect(()=>{
    if(!canvasRef.current)return;
    const ctx=canvasRef.current.getContext("2d");
    ctx.clearRect(0,0,200,200);
    // Draw dark fingerprint
    ctx.strokeStyle=revealed?"#C9AA7188":"#1F2330";
    ctx.lineWidth=revealed?2:1.5;
    ctx.lineCap="round";
    const pat=FP_PATTERNS[correctPattern];
    pat.paths.forEach(p=>{
      const path=new Path2D(p);
      ctx.stroke(path);
    });
    if(revealed){
      ctx.strokeStyle="#C9AA71AA";
      ctx.lineWidth=1;
      for(let i=0;i<8;i++){
        ctx.beginPath();
        ctx.arc(100,100,30+i*8,0,Math.PI*2);
        ctx.stroke();
      }
    }
  },[revealed,correctPattern]);

  useEffect(()=>{
    if(!scanning)return;
    let y=0;
    const int=setInterval(()=>{
      y=(y+3)%200;
      setScanY(y);
      if(y>80&&y<120)setRevealed(true);
    },16);
    const t=setTimeout(()=>{clearInterval(int);setScanning(false);setRevealed(true);},2200);
    return()=>{clearInterval(int);clearTimeout(t);};
  },[scanning]);

  const handleMatch=(s)=>{
    if(result)return;
    setChosen(s.id);
    const correct=s.fingerprint===correctPattern;
    setResult(correct?"match":"wrong");
    setTimeout(()=>{onMatch(correct,s,correctSuspect);},1200);
  };

  return(
    <div className="overlay">
      <div className="modal anim-up" style={{maxWidth:580}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div>
            <span className="tag tag-teal" style={{marginBottom:8,display:"inline-flex"}}>🔬 FINGERPRINT ANALYSIS</span>
            <h3 className="display" style={{fontSize:28,color:T.teal,marginTop:6}}>{clue.name}</h3>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <p style={{fontSize:12,color:T.inkSec,marginBottom:20,lineHeight:1.6}}>Scan the print, then match it to a suspect's known fingerprint pattern.</p>
        <div style={{display:"flex",gap:24,alignItems:"flex-start",flexWrap:"wrap",marginBottom:20}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
            <Lbl>Evidence Print</Lbl>
            <div className="fp-canvas" ref={canvasRef} style={{width:200,height:200}}>
              <canvas width={200} height={200} style={{position:"absolute",inset:0}}/>
              {scanning&&<div className="fp-scan-line" style={{top:scanY,background:"linear-gradient(90deg,transparent,#22D4B480,transparent)"}}/>}
              {!revealed&&!scanning&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}>
                <div style={{fontSize:11,color:T.inkMut,textAlign:"center",fontFamily:"'JetBrains Mono',monospace"}}>Print detected<br/>Scan to reveal</div>
              </div>}
            </div>
            {!revealed&&<button className="btn btn-teal btn-sm" onClick={()=>setScanning(true)} disabled={scanning}>{scanning?<><span className="spinner"/>Scanning...</>:"🔬 Scan Print"}</button>}
            {revealed&&<span className="tag tag-teal">✓ PATTERN: {FP_PATTERNS[correctPattern].name}</span>}
          </div>
          <div style={{flex:1,minWidth:240}}>
            <Lbl style={{marginBottom:10}}>Suspect Print Database</Lbl>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {suspects.map(s=>(
                <div key={s.id} className={"fp-match-card "+(chosen===s.id?(result==="match"?"matched":"wrong"):"")} onClick={()=>revealed&&handleMatch(s)} style={{opacity:revealed?1:0.4,pointerEvents:revealed?"all":"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:20}}>{s.avatar||"👤"}</span>
                    <div style={{textAlign:"left"}}>
                      <div style={{fontSize:12,fontWeight:700,color:chosen===s.id?(result==="match"?T.green:T.red):T.ink}}>{s.name}</div>
                      <div style={{fontSize:10,color:T.inkSec}}>Pattern: {s.fingerprint?FP_PATTERNS[s.fingerprint]?.name:"Unknown"}</div>
                    </div>
                    {chosen===s.id&&<span style={{marginLeft:"auto",fontSize:16}}>{result==="match"?"✅":"❌"}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {result&&(
          <div style={{padding:"12px 14px",borderRadius:4,background:result==="match"?T.green+"10":T.red+"10",border:"1px solid "+(result==="match"?T.green:T.red)+"30",textAlign:"center"}}>
            <div style={{fontSize:14,fontWeight:700,color:result==="match"?T.green:T.red,marginBottom:4}}>
              {result==="match"?"✅ PRINT MATCHED — Critical evidence logged!":"❌ NO MATCH — Print doesn't belong to that suspect"}
            </div>
            <div style={{fontSize:11,color:T.inkSec}}>
              {result==="match"?"The fingerprint conclusively places "+correctSuspect?.name+" at the evidence.":"Try matching to a different suspect."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// UV LIGHT MINIGAME — Feature #18
// ============================================================
function UVMinigame({suspect,onClose,onReveal}){
  const surfaceRef=useRef(null);
  const [torchPos,setTorchPos]=useState({x:-200,y:-200});
  const [revealed,setRevealed]=useState(false);
  const [revealPct,setRevealPct]=useState(0);
  const timerRef=useRef(null);
  const handleMove=(e)=>{
    const rect=surfaceRef.current?.getBoundingClientRect();
    if(!rect)return;
    const x=(e.clientX||e.touches?.[0]?.clientX||0)-rect.left;
    const y=(e.clientY||e.touches?.[0]?.clientY||0)-rect.top;
    setTorchPos({x:x-60,y:y-60});
    // Check if torch is in the "hotspot" center area
    const cx=rect.width/2,cy=rect.height/2;
    const dist=Math.sqrt((x-cx)**2+(y-cy)**2);
    if(dist<80){
      setRevealPct(p=>Math.min(100,p+2));
      if(revealPct>80)setRevealed(true);
    }
  };
  const clue=suspect.uvClue||"Nothing unusual detected under UV light.";
  const isClean=clue.startsWith("Nothing");
  return(
    <div className="overlay">
      <div className="modal anim-up" style={{maxWidth:500}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div>
            <span className="tag tag-purple" style={{marginBottom:8,display:"inline-flex",background:"#A020F010",color:"#A020F0",borderColor:"#A020F030"}}>🔦 UV LIGHT SCAN</span>
            <h3 className="display" style={{fontSize:26,color:"#A020F0",marginTop:6}}>{suspect.name}</h3>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <p style={{fontSize:12,color:T.inkSec,marginBottom:16,lineHeight:1.6}}>Move the UV torch across the surface to reveal hidden chemical traces.</p>
        <div
          ref={surfaceRef}
          className="uv-surface"
          style={{height:220,background:"#06080C",border:"1px solid #1F2330",marginBottom:16,cursor:"none"}}
          onMouseMove={handleMove}
          onTouchMove={handleMove}
        >
          {/* Background texture */}
          <div style={{position:"absolute",inset:0,opacity:0.06,backgroundImage:"repeating-linear-gradient(45deg,#C9AA71 0,#C9AA71 1px,transparent 0,transparent 50%)",backgroundSize:"8px 8px"}}/>
          {/* Suspect avatar big */}
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:64,opacity:0.08}}>{suspect.avatar||"👤"}</div>
          {/* UV torch glow */}
          <div className="uv-torch" style={{left:torchPos.x,top:torchPos.y,opacity:0.9,animation:revealed?"uvGlow 2s infinite":"none"}}/>
          {/* Scan progress */}
          <div style={{position:"absolute",bottom:8,left:12,right:12}}>
            <div className="bar-track"><div className="bar-fill" style={{width:revealPct+"%",background:"#A020F0"}}/></div>
          </div>
          {/* Revealed text */}
          <div className="uv-revealed" style={{opacity:revealed?1:0,color:isClean?"#42475A":"#A020F0",textShadow:isClean?"none":"0 0 20px #A020F0,0 0 40px #A020F0"}}>
            {isClean?"CLEAN — No traces detected":clue}
          </div>
          {!revealed&&<div style={{position:"absolute",top:12,left:0,right:0,textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.inkMut}}>Move UV torch to scan</div>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <div style={{flex:1}} className="bar-track" style={{height:6,background:"#1F2330",borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",width:revealPct+"%",background:"#A020F0",borderRadius:3,transition:"width 0.1s"}}/>
          </div>
          <span className="mono" style={{fontSize:10,color:"#A020F0"}}>{revealPct}%</span>
        </div>
        {revealed&&(
          <>
            <div style={{padding:"12px 14px",borderRadius:4,background:"#A020F010",border:"1px solid #A020F030",marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:700,color:"#A020F0",marginBottom:4}}>UV SCAN RESULT</div>
              <div style={{fontSize:13,color:isClean?T.inkSec:T.ink,lineHeight:1.6}}>{clue}</div>
            </div>
            <button className="btn btn-purple" style={{width:"100%",justifyContent:"center"}} onClick={()=>{onReveal(suspect,clue,isClean);onClose();}}>
              {isClean?"✓ Log Result — Clean":"🔬 Log UV Evidence"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// CCTV REPLAY — Feature #34
// ============================================================
function CCTVReplay({caseData,onClose}){
  const [typed,setTyped]=useState("");
  const [done,setDone]=useState(false);
  const text=caseData.cctv||"No CCTV footage available for this case.";
  useEffect(()=>{
    let i=0;
    const int=setInterval(()=>{
      if(i>=text.length){setDone(true);clearInterval(int);return;}
      setTyped(t=>t+text[i]);i++;
    },22);
    return()=>clearInterval(int);
  },[text]);
  return(
    <div className="overlay">
      <div className="modal anim-up" style={{maxWidth:600}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div>
            <span className="tag tag-muted" style={{marginBottom:8,display:"inline-flex",fontFamily:"'JetBrains Mono',monospace",fontSize:9}}>📹 CCTV RECONSTRUCTION</span>
            <h3 className="display" style={{fontSize:26,color:T.green,marginTop:6}}>SECURITY FOOTAGE LOG</h3>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="cctv-panel" style={{minHeight:160,marginBottom:16}}>
          <div className="cctv-text" style={{whiteSpace:"pre-wrap"}}>
            {"> CASE: "+caseData.title.toUpperCase()+"\n> ACCESSING FOOTAGE...\n> \n> "+typed}
            {!done&&<span className="cctv-cursor"/>}
          </div>
        </div>
        {done&&(
          <div style={{padding:"10px 14px",background:T.green+"08",border:"1px solid "+T.green+"28",borderRadius:3}}>
            <div style={{fontSize:11,color:T.green,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.1em"}}>✓ FOOTAGE LOG COMPLETE — Cross-reference with suspect timelines</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SCENE MAP — Feature #28: Top-down floor plan
// ============================================================
function SceneMapModal({caseData,activeRoom,setActiveRoom,clues,onClose}){
  const [ping,setPing]=useState(null);
  const mapData=SCENE_MAPS[caseData.id];
  if(!mapData)return(
    <div className="overlay" onClick={onClose}>
      <div className="modal anim-up" onClick={e=>e.stopPropagation()}>
        <h3 className="display" style={{fontSize:28,marginBottom:12}}>SCENE MAP</h3>
        <p style={{color:T.inkSec}}>No floor plan available for this case.</p>
        <button className="btn btn-ghost btn-sm" style={{marginTop:16}} onClick={onClose}>Close</button>
      </div>
    </div>
  );
  const roomClueCount=(roomId)=>clues.filter(c=>c.room===roomId&&c.found).length;
  const roomHasCritical=(roomId)=>clues.some(c=>c.room===roomId&&c.found&&c.critical);
  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal modal-wide anim-up" onClick={e=>e.stopPropagation()} style={{padding:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div>
            <span className="tag tag-gold" style={{marginBottom:8,display:"inline-flex"}}>🗺 SCENE MAP</span>
            <h3 className="display" style={{fontSize:28,color:T.gold,marginTop:6}}>{mapData.label}</h3>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{background:"#06080C",borderRadius:6,border:"1px solid #1F2330",padding:16,marginBottom:16,overflowX:"auto"}}>
          <svg width={mapData.width} height={mapData.height} style={{display:"block",margin:"0 auto"}}>
            {/* Connections */}
            {mapData.connections.map((conn,i)=>{
              const from=mapData.rooms.find(r=>r.id===conn.from);
              const to=mapData.rooms.find(r=>r.id===conn.to);
              if(!from||!to)return null;
              return<line key={i}
                x1={from.x+from.w/2} y1={from.y+from.h/2}
                x2={to.x+to.w/2} y2={to.y+to.h/2}
                stroke="#1F2330" strokeWidth="2" strokeDasharray="4,4"/>;
            })}
            {/* Rooms */}
            {mapData.rooms.map(room=>{
              const isActive=activeRoom===room.id;
              const clueCount=roomClueCount(room.id);
              const hasCrit=roomHasCritical(room.id);
              return(
                <g key={room.id} onClick={()=>{setActiveRoom(room.id);setPing(room.id);setTimeout(()=>setPing(null),1000);onClose();}}>
                  <rect x={room.x} y={room.y} width={room.w} height={room.h} rx={4} ry={4}
                    fill={isActive?room.color.replace("18","28"):room.color}
                    stroke={isActive?room.border:room.border.replace("50","28")}
                    strokeWidth={isActive?2:1}
                    className="scene-map-room"
                    style={{cursor:"pointer"}}/>
                  <text x={room.x+room.w/2} y={room.y+room.h/2-8} textAnchor="middle"
                    style={{fontSize:18,userSelect:"none"}} dominantBaseline="middle">{room.icon}</text>
                  <text x={room.x+room.w/2} y={room.y+room.h/2+12} textAnchor="middle"
                    fill={isActive?"#EDE9E0":"#8A8FA8"} fontSize={9}
                    fontFamily="'JetBrains Mono',monospace" fontWeight={700}
                    style={{textTransform:"uppercase",letterSpacing:"0.1em",userSelect:"none"}}>{room.label}</text>
                  {clueCount>0&&<>
                    <circle cx={room.x+room.w-10} cy={room.y+10} r={8} fill={hasCrit?T.gold:T.teal}/>
                    <text x={room.x+room.w-10} y={room.y+10} textAnchor="middle" dominantBaseline="middle"
                      fill="#06080C" fontSize={9} fontWeight={900}>{clueCount}</text>
                  </>}
                  {isActive&&<>
                    <circle cx={room.x+room.w/2} cy={room.y+room.h/2} r={Math.max(room.w,room.h)/2}
                      fill="none" stroke={room.border} strokeWidth={2} opacity={0.4}
                      className={ping===room.id?"map-ping":""}/>
                  </>}
                </g>
              );
            })}
          </svg>
        </div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          {mapData.rooms.map(r=>(
            <div key={r.id} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:activeRoom===r.id?T.gold:T.inkSec}}>
              <span style={{fontSize:14}}>{r.icon}</span>{r.label}
              {roomClueCount(r.id)>0&&<span className="tag tag-teal" style={{fontSize:8}}>{roomClueCount(r.id)} clue{roomClueCount(r.id)>1?"s":""}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// POLAROID WALL — Feature #60
// ============================================================
function PolaroidWall({caseData,foundClues,onClose}){
  const polaroids=caseData.polaroids||[];
  const angles=[-3,2,-1,3,-2,1,0,-3,2];
  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal modal-wide anim-up" onClick={e=>e.stopPropagation()} style={{background:"#1A1208",border:"1px solid #2A1E10"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <span className="tag tag-gold" style={{marginBottom:8,display:"inline-flex"}}>📷 CRIME SCENE PHOTOS</span>
            <h3 className="display" style={{fontSize:28,color:T.gold,marginTop:6}}>{caseData.title}</h3>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {polaroids.length===0&&<p style={{color:T.inkMut,fontSize:13}}>No photographs on file for this case.</p>}
        <div style={{display:"flex",gap:20,flexWrap:"wrap",justifyContent:"center",marginBottom:20}}>
          {polaroids.map((p,i)=>(
            <div key={p.id} className="polaroid" style={{transform:"rotate("+angles[i%9]+"deg)",animationDelay:i*0.1+"s"}}>
              <div className="polaroid-inner">
                <div style={{fontSize:44,opacity:0.7}}>{p.emoji}</div>
              </div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"#8A6510",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>{p.label}</div>
              <div className="polaroid-caption">{p.caption}</div>
            </div>
          ))}
        </div>
        {foundClues.filter(c=>c.critical).length>0&&(
          <div style={{borderTop:"1px solid #2A1E10",paddingTop:16,marginTop:8}}>
            <Lbl style={{marginBottom:10}}>Critical Evidence Photos</Lbl>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {foundClues.filter(c=>c.critical).map((c,i)=>(
                <div key={c.id} className="polaroid" style={{transform:"rotate("+angles[i%9]+"deg)",animationDelay:(polaroids.length+i)*0.1+"s",maxWidth:164}}>
                  <div className="polaroid-inner"><div style={{fontSize:32,opacity:0.6}}>🔑</div></div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"#8A6510",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>{c.room}</div>
                  <div className="polaroid-caption">{c.name}: {c.desc.slice(0,60)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// CORK NOTE
// ============================================================
function CorkNote({clue,onDiscover,forensics,onForensics,onFingerprint,onUV,delay}){
  return(
    <div className={"cork-note "+(clue.found?"found":"unknown")+(clue.critical?" critical":"")+" anim-pin"} style={{animationDelay:(delay||0)+"ms"}} onClick={()=>!clue.found&&onDiscover(clue)}>
      <div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",width:13,height:13,borderRadius:"50%",background:"radial-gradient(circle at 38% 32%, #F08888, #A03030)",boxShadow:"0 2px 6px rgba(0,0,0,0.7)",zIndex:1}}/>
      {clue.found?(
        <>
          {clue.critical&&<div className="cork-stamp">CRITICAL</div>}
          <div className="cork-note-title">{clue.name}</div>
          <div className="cork-note-body">{clue.desc}</div>
          <div style={{marginTop:8}}><span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:"#5A4A30",letterSpacing:"0.1em",textTransform:"uppercase"}}>📍 {clue.room}</span></div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:8}}>
            {!forensics?.report&&(
              <button onClick={e=>{e.stopPropagation();onForensics(clue);}} disabled={forensics?.loading} style={{background:"transparent",border:"1px solid #22D4B444",borderRadius:2,padding:"3px 7px",fontSize:9,cursor:"pointer",color:"#0D8070",fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.08em",textTransform:"uppercase"}}>
                {forensics?.loading?<span style={{fontSize:9}}>Analyzing...</span>:"🔬 Analyze"}
              </button>
            )}
            {clue.hasFingerprint&&(
              <button onClick={e=>{e.stopPropagation();onFingerprint(clue);}} style={{background:"transparent",border:"1px solid #C9AA7144",borderRadius:2,padding:"3px 7px",fontSize:9,cursor:"pointer",color:"#7A6535",fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.08em",textTransform:"uppercase"}}>
                👆 Fingerprint
              </button>
            )}
            {clue.hasUV&&(
              <button onClick={e=>{e.stopPropagation();onUV(clue);}} style={{background:"transparent",border:"1px solid #A020F044",borderRadius:2,padding:"3px 7px",fontSize:9,cursor:"pointer",color:"#8820C0",fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.08em",textTransform:"uppercase"}}>
                🔦 UV Scan
              </button>
            )}
          </div>
          {forensics?.report&&(
            <div className="forensics-panel" style={{marginTop:10}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"#22D4B4",marginBottom:5}}>🔬 FORENSICS</div>
              <div style={{fontSize:10,color:"#22D4B4",lineHeight:1.55,opacity:0.85}}>{forensics.report}</div>
            </div>
          )}
        </>
      ):(
        <>
          <div className="cork-note-title" style={{color:"#6A5A40"}}>Unknown Evidence</div>
          <div style={{fontSize:11,color:"#8A7A60",marginTop:4}}>Click to examine</div>
          <div style={{marginTop:8}}><span style={{fontSize:9,color:"#8A7A60",fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.08em",textTransform:"uppercase"}}>📍 {clue.room}</span></div>
        </>
      )}
    </div>
  );
}

// ============================================================
// CORKBOARD PANEL
// ============================================================
function CorkboardPanel({caseData,clues,activeRoom,setActiveRoom,discoverClue,notes,setNotes,settings,onShowMap,onShowCCTV,onShowPolaroids}){
  const [forensicsState,setForensicsState]=useState({});
  const [fpClue,setFpClue]=useState(null);
  const [uvSuspect,setUvSuspect]=useState(null);
  const [uvLog,setUvLog]=useState([]);
  const clueRoom=c=>c.room||caseData.rooms[Math.floor((clues.indexOf(c)/clues.length)*caseData.rooms.length)];
  const roomClues=clues.filter(c=>clueRoom(c)===activeRoom);
  const foundTotal=clues.filter(c=>c.found).length;
  const pct=Math.round((foundTotal/clues.length)*100);

  const runForensics=async(clue)=>{
    if(forensicsState[clue.id]?.report)return;
    setForensicsState(p=>Object.assign({},p,{[clue.id]:{loading:true,report:null,error:""}}));
    const sys="You are a forensic scientist writing a brief lab report. 3-4 sentences. Provide specific scientific detail. Include one unexpected additional finding that adds to the mystery.";
    const pr="Clue: "+clue.name+" — "+clue.desc+". Case: "+caseData.title+". Write a forensic lab report.";
    const txt=await callAI(pr,sys,"forensics-"+clue.id,settings);
    if(isAIErr(txt)){setForensicsState(p=>Object.assign({},p,{[clue.id]:{loading:false,report:null,error:txt.replace(AI_ERR,"").trim()}}));return;}
    setForensicsState(p=>Object.assign({},p,{[clue.id]:{loading:false,report:txt,error:""}}));
  };

  const handleUVReveal=(suspect,clue,isClean)=>{
    if(!isClean)setUvLog(l=>[...l,{suspectId:suspect.id,suspectName:suspect.name,clue}]);
  };

  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{flex:1,display:"flex",gap:6,flexWrap:"wrap"}}>
          {caseData.rooms.map(r=>(
            <button key={r} className={"btn btn-sm "+(activeRoom===r?"btn-gold":"btn-ghost")} onClick={()=>setActiveRoom(r)}>
              {r}
              {clues.filter(c=>clueRoom(c)===r&&c.found).length>0&&<span style={{background:T.teal,color:"#06080C",borderRadius:"50%",width:14,height:14,fontSize:8,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{clues.filter(c=>clueRoom(c)===r&&c.found).length}</span>}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:6}}>
          <button className="btn btn-ghost btn-sm" onClick={onShowMap}>🗺 Map</button>
          <button className="btn btn-ghost btn-sm" onClick={onShowCCTV}>📹 CCTV</button>
          <button className="btn btn-ghost btn-sm" onClick={onShowPolaroids}>📷 Photos</button>
        </div>
        <span className="mono" style={{fontSize:10,color:T.teal}}>{pct}%</span>
      </div>
      <div className="corkboard" style={{marginBottom:16}}>
        {roomClues.length===0&&<div style={{textAlign:"center",color:"#6A5A40",fontSize:13,paddingTop:60}}>Room appears clear.</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:20,alignItems:"start"}}>
          {roomClues.map((c,i)=>(
            <CorkNote key={c.id} clue={c} delay={i*80}
              onDiscover={discoverClue}
              forensics={forensicsState[c.id]}
              onForensics={runForensics}
              onFingerprint={cl=>setFpClue(cl)}
              onUV={cl=>{
                // UV scans a suspect — pick the guilty one for the real effect
                const s=caseData.suspects.find(x=>x.guilty)||caseData.suspects[0];
                setUvSuspect(s);
              }}
            />
          ))}
        </div>
      </div>
      {uvLog.length>0&&(
        <div style={{marginBottom:12,padding:"10px 14px",background:"#A020F008",border:"1px solid #A020F028",borderRadius:4}}>
          <Lbl style={{marginBottom:6}}>UV Evidence Log</Lbl>
          {uvLog.map((u,i)=><div key={i} style={{fontSize:11,color:"#A020F0",marginBottom:3}}>🔦 {u.suspectName}: {u.clue}</div>)}
        </div>
      )}
      <div className="card" style={{padding:14}}>
        <Lbl style={{marginBottom:8}}>Detective Notes — {activeRoom}</Lbl>
        <textarea className="input" placeholder={"Observations in "+activeRoom+"..."} value={notes[activeRoom]||""} onChange={e=>setNotes(n=>Object.assign({},n,{[activeRoom]:e.target.value}))} style={{minHeight:64,fontSize:12}}/>
      </div>
      {fpClue&&<FingerprintMinigame clue={fpClue} suspects={caseData.suspects} onMatch={(correct,s,correct2)=>{}} onClose={()=>setFpClue(null)}/>}
      {uvSuspect&&<UVMinigame suspect={uvSuspect} onClose={()=>setUvSuspect(null)} onReveal={handleUVReveal}/>}
    </div>
  );
}

// ============================================================
// PSYCH PROFILER
// ============================================================
function PsychProfiler({suspect,settings,caseData}){
  const [profile,setProfile]=useState(null);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const psych=suspect?.psych;
  const generate=async()=>{
    setLoading(true);setErr("");
    const sys="You are a forensic psychologist. Write a 3-sentence psychological assessment. Be insightful and noir-toned. Include a prediction of behavior under interrogation pressure.";
    const pr="Suspect: "+suspect.name+", "+suspect.role+" (age "+suspect.age+"). Archetype: "+(psych?.archetype||"unknown")+". Traits: "+(psych?.traits?.join(", ")||"unknown")+". Secret: "+suspect.secret+". Case: "+caseData.title+".";
    const txt=await callAI(pr,sys,"profiler-"+suspect.id,settings);
    if(isAIErr(txt)){setErr(txt.replace(AI_ERR,"").trim());setLoading(false);return;}
    setProfile(txt);setLoading(false);
  };
  if(!suspect)return null;
  return(
    <div className="psych-card">
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span className="tag tag-purple">🧠 Psych Profile</span>
        {psych?.archetype&&<span style={{fontSize:11,color:T.purple}}>{psych.archetype}</span>}
      </div>
      {psych?.traits&&psych.traits.length>0&&(
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          {psych.traits.map((t,i)=><span key={i} className="profiler-trait">{t}</span>)}
        </div>
      )}
      {psych?.tell&&(
        <div style={{fontSize:11,color:T.inkSec,marginBottom:10,padding:"8px 10px",background:T.purple+"08",borderRadius:3,border:"1px solid "+T.purple+"20"}}>
          <span style={{color:T.purple,fontWeight:600}}>Tell: </span>{psych.tell}
        </div>
      )}
      {!profile&&!loading&&<button className="btn btn-purple btn-sm" onClick={generate}>🧠 Generate Deep Profile</button>}
      {loading&&<div style={{display:"flex",gap:8,alignItems:"center",fontSize:12,color:T.inkMut}}><span className="spinner"/>Analyzing psychology...</div>}
      {err&&<div style={{fontSize:11,color:T.red,marginTop:6}}>{err}</div>}
      {profile&&<div style={{fontSize:12,color:T.inkSec,lineHeight:1.65,marginTop:4,padding:"10px 12px",background:T.purple+"06",borderRadius:3,border:"1px solid "+T.purple+"18"}}>{profile}</div>}
    </div>
  );
}

// ============================================================
// CASE NOTES
// ============================================================
function CaseNotes({notes,onAddNote}){
  const [input,setInput]=useState("");
  return(
    <div className="notes-panel">
      <div className="notes-header">
        <span style={{fontSize:14}}>📝</span>
        <Lbl>Case Notes</Lbl>
        <span className="mono" style={{fontSize:9,color:T.inkMut,marginLeft:"auto"}}>{notes.length}</span>
      </div>
      <div className="notes-body">
        {notes.length===0&&<div style={{textAlign:"center",color:T.inkMut,fontSize:12,padding:"12px 0"}}>No notes yet.</div>}
        <div style={{maxHeight:200,overflowY:"auto",display:"flex",flexDirection:"column",gap:6,marginBottom:8}}>
          {notes.map((n,i)=>(
            <div key={i} className="note-entry">
              <div className="note-time">{n.time}</div>
              <div>{n.text}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:7}}>
          <input className="input" style={{fontSize:12,padding:"7px 11px"}} placeholder="Add note..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&input.trim()){onAddNote(input);setInput("");}}}/>
          <button className="btn btn-ghost btn-sm" onClick={()=>{if(input.trim()){onAddNote(input);setInput("");}}} disabled={!input.trim()}>+</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SIDEBAR
// ============================================================
function Sidebar({caseData,foundClues,clues,progress,revSuspicion,hint,showHint,hintUsed,hintLoading,getHint,unlimitedHints,aiHints,notes,onAddNote,onShowMap}){
  const critFound=foundClues.filter(c=>c.critical).length;
  const critTotal=clues.filter(c=>c.critical).length;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      <div className="card card-gold" style={{padding:"14px 16px",marginBottom:12}}>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
          <span style={{fontSize:20}}>{caseData.badge||"🔍"}</span>
          <div>
            <div className="display" style={{fontSize:16,color:T.gold}}>{caseData.title}</div>
            <div style={{fontSize:10,color:T.inkMut,marginTop:1}}>{caseData.setting}</div>
          </div>
        </div>
        <div style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <Lbl>Evidence</Lbl>
            <span className="mono" style={{fontSize:9,color:T.teal}}>{foundClues.length}/{clues.length}</span>
          </div>
          <div className="bar-track"><div className="bar-fill" style={{width:progress+"%",background:"linear-gradient(90deg,"+T.teal+","+T.gold+")"}}/></div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <span className="tag tag-red" style={{fontSize:8}}>🔑 {critFound}/{critTotal} critical</span>
          {revSuspicion>0&&<span className="tag tag-purple" style={{fontSize:8}}>🎯 {revSuspicion}%</span>}
        </div>
      </div>
      <div className="sidebar-section">
        <div className="sidebar-section-title">Case Brief</div>
        <div style={{fontSize:11,color:T.inkSec,lineHeight:1.65,marginBottom:8}}>{caseData.summary}</div>
        <div style={{fontSize:10,color:T.inkMut,lineHeight:1.6}}>
          <div style={{marginBottom:3}}><span style={{color:T.inkSec}}>Victim: </span>{caseData.victim}</div>
          <div><span style={{color:T.inkSec}}>Cause: </span>{caseData.cause}</div>
        </div>
      </div>
      {foundClues.length>0&&(
        <div className="sidebar-section">
          <div className="sidebar-section-title">Evidence Found</div>
          <div className="evidence-thread">
            {foundClues.map((c,i)=>(
              <div key={c.id} style={{marginBottom:12,paddingLeft:14,position:"relative"}}>
                <div className="thread-node" style={{top:4,background:c.critical?T.gold:T.teal}}/>
                <div style={{fontSize:11,fontWeight:600,color:c.critical?T.gold:T.ink,marginBottom:1}}>{c.name}</div>
                <div style={{fontSize:10,color:T.inkSec,lineHeight:1.4}}>{c.desc.slice(0,60)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {aiHints&&(
        <div className="sidebar-section">
          <div className="sidebar-section-title">AI Hint</div>
          {!showHint?(
            <button className="btn btn-ghost btn-sm" style={{width:"100%",justifyContent:"center"}} onClick={getHint} disabled={(!unlimitedHints&&hintUsed)||hintLoading}>
              {hintLoading?<><span className="spinner"/>Thinking...</>:(!unlimitedHints&&hintUsed?"✓ Used":"💡 Get hint")}
            </button>
          ):(
            <div style={{fontSize:11,color:T.gold,lineHeight:1.65,padding:"10px 12px",background:T.gold+"08",border:"1px solid "+T.gold+"20",borderRadius:3,fontStyle:"italic"}}>{hint}</div>
          )}
        </div>
      )}
      <div className="sidebar-section"><CaseNotes notes={notes||[]} onAddNote={onAddNote}/></div>
    </div>
  );
}

// ============================================================
// INTERROGATION TAB — Features #2 (memory), #3 (good/bad cop),
//                              #5 (suspect asks back), #7 (slip),
//                              #10 (patience/lawyer up)
// ============================================================
function InterrogationTab({caseData,suspects,selSuspect,setSelSuspect,interrogHist,setInterrogHist,questionCounts,setQuestionCounts,dynamicAlibis,setDynamicAlibis,lieScores,setLieScores,patience,setPatience,player,settings,diff}){
  const [customQ,setCustomQ]=useState("");
  const [loading,setLoading]=useState(false);
  const [copMode,setCopMode]=useState("neutral"); // "good","bad","neutral"
  const chatRef=useRef(null);
  const hist=selSuspect?(interrogHist[selSuspect.id]||[]):[];
  const qCount=selSuspect?(questionCounts[selSuspect.id]||0):0;
  const lieScore=selSuspect?lieScores[selSuspect.id]:null;
  const currentAlibi=selSuspect?(dynamicAlibis[selSuspect.id]||selSuspect.alibi):"";
  const alibiChanged=selSuspect&&dynamicAlibis[selSuspect.id]&&dynamicAlibis[selSuspect.id]!==selSuspect.alibi;
  const suspPatience=selSuspect?(patience[selSuspect.id]??diff.patienceBase):diff.patienceBase;
  const isLawyered=suspPatience<=0;
  const currentMood=selSuspect?getMood(qCount,selSuspect.guilty,suspPatience):"cooperative";
  useEffect(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[interrogHist,selSuspect]);

  const askSuspect=async(suspect,question)=>{
    if(!question.trim()||isLawyered)return;
    setCustomQ("");setLoading(true);
    const newCount=(questionCounts[suspect.id]||0)+1;
    const currentAl=dynamicAlibis[suspect.id]||suspect.alibi;
    const prevAnswers=(interrogHist[suspect.id]||[]).slice(-3).map(e=>"Q: "+e.q+" A: "+e.a).join(" | ");
    const copInstr=copMode==="good"?"The detective is warm, empathetic, understanding — use this to lower their guard.":copMode==="bad"?"The detective is aggressive, accusatory, intimidating — respond defensively or angrily.":"Standard interrogation tone.";
    const sys=[
      "You are "+suspect.name+", "+suspect.role+" (age "+suspect.age+").",
      "Mood: "+currentMood+" ("+MOODS[currentMood]?.desc+").",
      "Guilty: "+(suspect.guilty?"YES":"NO")+". Alibi: "+currentAl+". Secret: "+suspect.secret+".",
      "Detective style: "+copInstr,
      "Previous answers you gave: "+(prevAnswers||"none — this is the first question")+".",
      "IMPORTANT: Stay consistent with your previous answers. If you said something before, remember it.",
      suspect.guilty&&newCount>3?" Occasionally show micro-tells — a hesitation, a contradictory detail.":" Remain consistent and composed.",
      "2-4 sentences. Never confess directly.",
      "SOMETIMES (1 in 4 chance) end with a suspicious question directed back at the detective — e.g. 'Why are you so interested in that?' or 'Who told you that?'. Only do this if it fits naturally.",
    ].join(" ");
    const resp=await callAI("Detective "+player.name+" ("+copMode+" cop) asks: "+question,sys,"interrog-"+suspect.id,settings);
    let ls=null;
    if(settings.lieDetector||diff.lieDetectorForce){
      const lsys="Rate deception 0-100. 0=fully truthful, 100=complete lie. Return ONLY a number.";
      const lr=await callAI("Suspect is "+(suspect.guilty?"GUILTY":"INNOCENT")+". Said: "+resp,lsys,"lie-"+suspect.id,settings);
      if(!isAIErr(lr)){const n=parseInt(lr.replace(/\D/g,""));if(!isNaN(n))ls=Math.min(100,Math.max(0,n));}
    }
    // Patience drain: bad cop drains faster, good cop slower
    const drain=copMode==="bad"?2:copMode==="good"?0:1;
    setPatience(p=>Object.assign({},p,{[suspect.id]:Math.max(0,(p[suspect.id]??diff.patienceBase)-drain)}));
    const entry={q:question,a:isAIErr(resp)?"[Unavailable]":resp,mood:currentMood,lieScore:ls,player:player.name,isErr:isAIErr(resp),copMode};
    setInterrogHist(p=>Object.assign({},p,{[suspect.id]:[...(p[suspect.id]||[]),entry]}));
    setQuestionCounts(p=>Object.assign({},p,{[suspect.id]:newCount}));
    if(ls!==null)setLieScores(p=>Object.assign({},p,{[suspect.id]:ls}));
    if(!isAIErr(resp))await speakText(resp,settings);
    setLoading(false);
  };

  // Feature #7: detect near-slip in last response
  const lastEntry=hist[hist.length-1];
  const maybeSlip=lastEntry&&selSuspect?.guilty&&lastEntry.lieScore>70&&!lastEntry.isErr;

  return(
    <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:16}}>
      <div>
        <Lbl style={{marginBottom:10}}>Suspects</Lbl>
        {suspects.map(s=>{
          const qc=questionCounts[s.id]||0;
          const sp=patience[s.id]??diff.patienceBase;
          const lawyered=sp<=0;
          return(
            <div key={s.id} className={"portrait-card "+(selSuspect?.id===s.id?"selected ":"")+(lawyered?"lawyered":"")} style={{marginBottom:10}} onClick={()=>setSelSuspect(s)}>
              <div className="portrait-avatar" style={{height:60,fontSize:30}}>{s.avatar||"👤"}</div>
              <div className="portrait-body">
                <div className="portrait-name" style={{fontSize:15}}>{s.name}</div>
                <div className="portrait-role">{s.role}</div>
                <div style={{marginTop:4}}>
                  {/* Patience meter */}
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}>
                    {[...Array(diff.patienceBase)].map((_,i)=>(
                      <div key={i} style={{width:8,height:8,borderRadius:2,background:i<sp?T.amber:T.smoke,transition:"background 0.3s"}}/>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {qc>0&&<MoodBadge count={qc} guilty={s.guilty} patience={sp}/>}
                    {lawyered&&<span className="tag tag-purple" style={{fontSize:8}}>⚖ LAWYERED</span>}
                    {dynamicAlibis[s.id]&&<span className="tag tag-amber" style={{fontSize:8}}>⚡</span>}
                    {lieScores[s.id]!=null&&<span className="tag tag-muted" style={{fontSize:8}}>{lieScores[s.id]}%</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",flexDirection:"column"}}>
        {!selSuspect?(
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",height:280,color:T.inkMut,fontSize:14,flexDirection:"column",gap:10}}>
            <span style={{fontSize:40}}>👤</span>Select a suspect
          </div>
        ):(
          <>
            <div className="card card-gold" style={{padding:"14px 16px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                <div>
                  <div className="display" style={{fontSize:22,color:T.gold}}>{selSuspect.name}</div>
                  <div style={{fontSize:12,color:T.inkSec,marginTop:2}}>{selSuspect.role} · Age {selSuspect.age}</div>
                  <div style={{fontSize:11,marginTop:4,color:alibiChanged?T.amber:T.inkMut}}>
                    {alibiChanged&&<span style={{color:T.amber,fontWeight:700}}>⚡ </span>}{currentAlibi}
                  </div>
                </div>
                <MoodBadge count={qCount} guilty={selSuspect.guilty} patience={suspPatience}/>
              </div>
              {/* Patience bar */}
              <div style={{marginTop:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <Lbl>Patience</Lbl>
                  <span className="mono" style={{fontSize:9,color:suspPatience<=1?T.red:suspPatience<=2?T.amber:T.inkMut}}>{isLawyered?"LAWYERED UP":suspPatience+" left"}</span>
                </div>
                <div style={{display:"flex",gap:4}}>
                  {[...Array(diff.patienceBase)].map((_,i)=>(
                    <div key={i} style={{flex:1,height:4,borderRadius:2,background:i<suspPatience?T.amber:T.smoke,transition:"background 0.3s"}}/>
                  ))}
                </div>
              </div>
              {(settings.lieDetector||diff.lieDetectorForce)&&lieScore!=null&&<div style={{marginTop:10}}><LieMeter value={lieScore}/></div>}
              {settings.psychProfiler&&<PsychProfiler suspect={selSuspect} settings={settings} caseData={caseData}/>}
            </div>

            {/* Feature #3: Good Cop / Bad Cop toggle */}
            <div style={{display:"flex",gap:6,marginBottom:10}}>
              <Lbl style={{marginRight:6,alignSelf:"center"}}>Tactic:</Lbl>
              {[["good","😊 Good Cop","btn-teal"],["neutral","😐 Neutral","btn-ghost"],["bad","😡 Bad Cop","btn-red"]].map(([id,lbl,cls])=>(
                <button key={id} className={"btn btn-sm "+(copMode===id?cls:"btn-ghost")} onClick={()=>setCopMode(id)}>{lbl}</button>
              ))}
            </div>
            {copMode==="good"&&<div style={{fontSize:10,color:T.teal,marginBottom:8,padding:"5px 10px",background:T.teal+"08",borderRadius:3}}>Good cop: slower patience drain, suspects open up more</div>}
            {copMode==="bad"&&<div style={{fontSize:10,color:T.red,marginBottom:8,padding:"5px 10px",background:T.red+"08",borderRadius:3}}>Bad cop: drains patience fast — risky but can force slips</div>}

            {isLawyered&&(
              <div style={{padding:"14px",background:T.purple+"10",border:"1px solid "+T.purple+"30",borderRadius:4,marginBottom:10,textAlign:"center"}}>
                <div style={{fontSize:20,marginBottom:6}}>⚖</div>
                <div style={{fontSize:13,fontWeight:700,color:T.purple,marginBottom:4}}>{selSuspect.name} has lawyered up</div>
                <div style={{fontSize:11,color:T.inkSec}}>Interrogation ended. Use cross-exam or build more evidence to proceed.</div>
              </div>
            )}

            <div ref={chatRef} style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,marginBottom:10,minHeight:180,maxHeight:300}}>
              {hist.length===0&&<div style={{textAlign:"center",color:T.inkMut,fontSize:13,paddingTop:40}}>No questions yet.</div>}
              {hist.map((e,i)=>(
                <div key={i} style={{display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{display:"flex",justifyContent:"flex-end"}}>
                    <div className="bubble bubble-user">
                      <span style={{fontSize:10,color:e.copMode==="bad"?T.red:e.copMode==="good"?T.teal:T.inkSec,display:"block",marginBottom:3}}>{e.player} · {e.copMode==="good"?"😊 Good Cop":e.copMode==="bad"?"😡 Bad Cop":"😐 Neutral"}</span>
                      {e.q}
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:3}}>
                    <div style={{display:"flex",justifyContent:"flex-start"}}>
                      {/* Feature #5: detect suspect asking back */}
                      {e.a&&(e.a.includes("Why are you")||e.a.includes("Who told you")||e.a.includes("Why do you")||e.a.includes("What makes you"))?(
                        <div className="bubble bubble-backtalk">
                          <span style={{fontSize:10,color:T.amber,display:"block",marginBottom:3}}>{selSuspect.name} · 🔄 QUESTIONING YOU</span>
                          {e.a}
                        </div>
                      ):(
                        <div className={"bubble "+(e.isErr?"bubble-error":"bubble-ai")}>
                          <span style={{fontSize:10,display:"block",marginBottom:3,color:MOODS[e.mood]?.color||T.gold}}>{selSuspect.name} · {MOODS[e.mood]?.icon} {e.mood}</span>
                          {e.a}
                        </div>
                      )}
                    </div>
                    {e.lieScore!=null&&(settings.lieDetector||diff.lieDetectorForce)&&<span style={{fontSize:10,color:e.lieScore>60?T.amber:T.inkMut,paddingLeft:4}}>🧠 {e.lieScore}% — {e.lieScore<25?"truthful":e.lieScore<50?"uncertain":e.lieScore<75?"evasive":"likely lying"}</span>}
                  </div>
                </div>
              ))}
              {loading&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"6px 10px"}}><span className="spinner"/><span style={{fontSize:11,color:T.inkMut}}>{selSuspect.name} responding...</span></div>}
            </div>

            {/* Feature #7: Near-slip alert */}
            {maybeSlip&&(
              <div style={{padding:"8px 12px",background:T.amber+"10",border:"1px solid "+T.amber+"30",borderRadius:3,marginBottom:8,display:"flex",gap:8,alignItems:"center"}}>
                <span style={{color:T.amber,fontSize:14}}>⚠</span>
                <div style={{fontSize:11,color:T.amber}}>Possible slip detected — their last answer may contain an inconsistency worth pressing.</div>
              </div>
            )}

            {!isLawyered&&(
              <>
                {caseData.interrogationQuestions?.[selSuspect.id]?.length>0&&(
                  <div style={{marginBottom:8}}>
                    <Lbl style={{marginBottom:5}}>Suggested</Lbl>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                      {caseData.interrogationQuestions[selSuspect.id].map((item,i)=>(
                        <button key={i} className="btn btn-ghost btn-sm" onClick={()=>askSuspect(selSuspect,item.q)} disabled={loading}>{item.q.slice(0,38)}{item.q.length>38?"...":""}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{display:"flex",gap:8}}>
                  <input className="input" placeholder={"Ask "+selSuspect.name.split(" ")[0]+"..."} value={customQ} onChange={e=>setCustomQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&customQ.trim()&&!loading&&askSuspect(selSuspect,customQ)} style={{flex:1}}/>
                  <button className="btn btn-gold" disabled={!customQ.trim()||loading} onClick={()=>askSuspect(selSuspect,customQ)}>{loading?<span className="spinner"/>:"Ask"}</button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// CROSS-EXAM TAB
// ============================================================
function CrossExamTab({caseData,suspects,selSuspect,setSelSuspect,crossState,setCrossState,dynamicAlibis,setDynamicAlibis,player,settings,diff}){
  const [tactic,setTactic]=useState(null);
  const [loading,setLoading]=useState(false);
  const chatRef=useRef(null);
  const state=selSuspect?(crossState[selSuspect.id]||{round:0,cracked:false,history:[]}):null;
  const examData=selSuspect?caseData.crossExam?.[selSuspect.id]:null;
  const pct=state&&examData?Math.min(100,Math.round((state.round/(examData.threshold||3))*100)):0;
  useEffect(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[crossState,selSuspect]);
  const TACTICS=[{id:"evidence",icon:"🔎",l:"Present Evidence"},{id:"contradiction",icon:"⚔",l:"Point Contradiction"},{id:"bluff",icon:"🎭",l:"Bluff Pressure"},{id:"witness",icon:"👁",l:"Cite Witness"}];
  const doCrossExam=async(suspect,tac)=>{
    setLoading(true);
    const curState=crossState[suspect.id]||{round:0,cracked:false,history:[]};
    const newRound=curState.round+1;
    const threshold=Math.max(1,Math.round((examData?.threshold||2)*diff.crackMult));
    const willCrack=newRound>=threshold&&suspect.guilty;
    const currentAlibi=dynamicAlibis[suspect.id]||suspect.alibi;
    const sys="You are "+suspect.name+" under cross-examination. Alibi: "+currentAlibi+". Contradiction: "+(examData?.contradiction||"Your alibi doesn't add up.")+". Pressure: "+(examData?.pressure||"key evidence")+". Guilty: "+(suspect.guilty?"YES":"NO")+". Round "+newRound+"/"+threshold+". "+(willCrack?"BREAKING POINT — dramatic crack, near-confession, emotional breakdown.":"Hold firm but fracture subtly.")+". 2-3 sentences. Very tense.";
    const resp=await callAI("Tactic "+tac,sys,"cross-"+suspect.id,settings);
    if(!willCrack&&newRound>1&&!isAIErr(resp)){
      const asys="Extract suspect's new alibi in one sentence. Return ONLY the alibi.";
      const nar=await callAI("Original: "+currentAlibi+". Latest: "+resp,asys,"dynamic-alibi",settings);
      if(!isAIErr(nar)&&nar.length>10&&nar.length<200)setDynamicAlibis(p=>Object.assign({},p,{[suspect.id]:nar}));
    }
    const newH=[...curState.history,{tactic:tac,response:resp,round:newRound,cracked:willCrack,isErr:isAIErr(resp)}];
    setCrossState(p=>Object.assign({},p,{[suspect.id]:{round:newRound,cracked:willCrack||curState.cracked,history:newH}}));
    await speakText(resp,settings);
    setTactic(null);setLoading(false);
  };
  return(
    <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:16}}>
      <div>
        <Lbl style={{marginBottom:10}}>Suspects</Lbl>
        {suspects.map(s=>{
          const cs=crossState[s.id]||{};
          return(
            <div key={s.id} className={"portrait-card "+(selSuspect?.id===s.id?"selected ":"")+(cs.cracked?"cracked":"")} style={{marginBottom:10}} onClick={()=>setSelSuspect(s)}>
              <div className="portrait-avatar" style={{height:56,fontSize:28}}>{s.avatar||"👤"}</div>
              <div className="portrait-body" style={{padding:"10px 12px"}}>
                <div className="portrait-name" style={{fontSize:15}}>{s.name}</div>
                <div className="portrait-role">{s.role}</div>
                <div style={{marginTop:6,display:"flex",gap:4,flexWrap:"wrap"}}>
                  {cs.cracked&&<span className="tag tag-red" style={{fontSize:9}}>CRACKED</span>}
                  {cs.round>0&&!cs.cracked&&<span className="tag tag-amber" style={{fontSize:9}}>Rd {cs.round}</span>}
                  {dynamicAlibis[s.id]&&<span className="tag tag-amber" style={{fontSize:9}}>⚡</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div>
        {!selSuspect?<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:280,color:T.inkMut,fontSize:14}}>Select a suspect to cross-examine</div>:(
          <>
            <div className="card card-red" style={{padding:"14px 16px",marginBottom:12}}>
              <div className="display" style={{fontSize:20,color:T.red,marginBottom:3}}>{selSuspect.name} — Cross-Exam</div>
              <div style={{fontSize:12,color:T.inkSec,marginBottom:12}}>Round {state.round} · {state.cracked?"CRACKED":"Holding"}</div>
              {examData&&<>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <div style={{flex:1}} className="bar-track"><div className="bar-fill" style={{width:pct+"%",background:"linear-gradient(90deg,"+T.amber+"88,"+T.red+")"}}/></div>
                  <span className="mono" style={{fontSize:10,color:T.red}}>{pct}%</span>
                </div>
                <div style={{fontSize:11,color:T.inkMut}}>Contradiction: <span style={{color:T.inkSec}}>{examData.contradiction}</span></div>
              </>}
            </div>
            <div ref={chatRef} style={{height:190,overflowY:"auto",display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
              {state.history.length===0&&<div style={{textAlign:"center",color:T.inkMut,fontSize:12,paddingTop:30}}>Choose a tactic.</div>}
              {state.history.map((e,i)=>(
                <div key={i} style={{display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{display:"flex",justifyContent:"flex-end"}}><div className="bubble bubble-user" style={{background:T.red+"10",borderColor:T.red+"24"}}><span style={{fontSize:10,color:T.red,display:"block",marginBottom:2}}>Tactic: {e.tactic}</span>Pressing...</div></div>
                  <div style={{display:"flex",justifyContent:"flex-start"}}><div className={"bubble "+(e.isErr?"bubble-error":e.cracked?"bubble-pressure":"bubble-ai")}><span style={{fontSize:10,color:e.cracked?T.red:T.inkMut,display:"block",marginBottom:2}}>{e.cracked?"⚠ CRACKING — ":""}{selSuspect.name} Rd {e.round}</span>{e.response}</div></div>
                </div>
              ))}
              {loading&&<div style={{display:"flex",gap:8,alignItems:"center"}}><span className="spinner"/><span style={{fontSize:11,color:T.inkMut}}>Applying pressure...</span></div>}
            </div>
            {!state.cracked?(
              <>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                  {TACTICS.map(t=><div key={t.id} className={"tactic-card "+(tactic===t.id?"selected":"")} onClick={()=>setTactic(t.id)} style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{t.icon}</span><div style={{fontSize:12,fontWeight:600,color:tactic===t.id?T.red:T.ink}}>{t.l}</div></div>)}
                </div>
                <button className="btn btn-red" style={{width:"100%",justifyContent:"center"}} disabled={!tactic||loading} onClick={()=>doCrossExam(selSuspect,tactic)}>{loading?<><span className="spinner"/>Pressing...</>:"⚔ Press Contradiction"}</button>
              </>
            ):<div className="card card-red pulse-red" style={{padding:16,textAlign:"center"}}><div style={{fontSize:28,marginBottom:6}}>💥</div><div className="display" style={{fontSize:22,color:T.red}}>SUSPECT CRACKED</div></div>}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// WITNESS TAB
// ============================================================
function WitnessTab({witnesses,witnessState,setWitnessState,player,settings}){
  const [selWitness,setSelWitness]=useState(null);
  const [customQ,setCustomQ]=useState("");
  const [loading,setLoading]=useState(false);
  const chatRef=useRef(null);
  const hist=selWitness?witnessState[selWitness.id]?.chatHistory||[]:[];
  useEffect(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[witnessState,selWitness]);
  const TRIGGERS=[{id:"general",label:"Opening Statement",icon:"💬"},{id:"suspicious",label:"Suspicious Behavior",icon:"🔍"},{id:"diana",label:"About Diana",icon:"👤"},{id:"noah",label:"About Noah",icon:"👤"},{id:"sera",label:"About Sera",icon:"👤"},{id:"camera",label:"About Evidence",icon:"📷"}];
  const callWitness=async(witness,trigger)=>{
    setLoading(true);
    const preset=witness.statements?.find(s=>s.trigger===trigger)||witness.statements?.[0];
    const existing=witnessState[witness.id]||{chatHistory:[]};
    let response;
    if(preset&&existing.chatHistory.length<2){response=preset.text;}
    else{
      const sys="You are "+witness.name+", "+witness.role+". "+witness.summary+". Known: "+(witness.statements?.map(s=>s.text).join(" ")||"none")+". Prior answers: "+(existing.chatHistory.map(h=>h.response).join(" | ")||"none")+". 2-3 sentences about: "+trigger+".";
      response=await callAI("Witness asked about: "+trigger,sys,"witness-"+witness.id,settings);
    }
    const entry={trigger,response:isAIErr(response)?"[Witness unavailable]":response,player:player.name};
    setWitnessState(p=>Object.assign({},p,{[witness.id]:{unlocked:true,chatHistory:[...(p[witness.id]?.chatHistory||[]),entry]}}));
    if(!isAIErr(response))await speakText(response,settings);
    setLoading(false);
  };
  const askCustom=async(witness,q)=>{
    if(!q.trim())return;setLoading(true);
    const existing=witnessState[witness.id]||{chatHistory:[]};
    const sys="You are "+witness.name+", "+witness.role+". "+witness.summary+". Known: "+(witness.statements?.map(s=>s.text).join(" ")||"none")+". Prior: "+(existing.chatHistory.map(h=>h.response).join(" | ")||"none")+". Reply honestly in 2-3 sentences.";
    const resp=await callAI("Detective asks: "+q,sys,"witness-custom-"+witness.id,settings);
    const entry={trigger:"custom",question:q,response:isAIErr(resp)?"[Unavailable]":resp,player:player.name};
    setWitnessState(p=>Object.assign({},p,{[witness.id]:Object.assign({},p[witness.id]||{unlocked:true},{chatHistory:[...(p[witness.id]?.chatHistory||[]),entry]})}));
    if(!isAIErr(resp))await speakText(resp,settings);
    setCustomQ("");setLoading(false);
  };
  if(!witnesses||witnesses.length===0)return<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:300,color:T.inkMut,fontSize:14}}>No witnesses in this case.</div>;
  return(
    <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:16}}>
      <div>
        <Lbl style={{marginBottom:10}}>Witnesses</Lbl>
        {witnesses.map(w=>(
          <div key={w.id} className={"witness-item "+(selWitness?.id===w.id?"selected":"")} style={{marginBottom:10}} onClick={()=>setSelWitness(w)}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><span style={{fontSize:24}}>{w.avatar||"👤"}</span><div><div style={{fontWeight:700,fontSize:13}}>{w.name}</div><div style={{fontSize:11,color:T.inkSec}}>{w.role}</div></div></div>
            <div style={{fontSize:11,color:T.inkMut,lineHeight:1.4}}>{w.summary}</div>
            {witnessState[w.id]?.unlocked&&<span className="tag tag-teal" style={{fontSize:8,marginTop:6}}>INTERVIEWED</span>}
          </div>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column"}}>
        {!selWitness?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:T.inkMut,fontSize:14}}>Select a witness</div>:(
          <>
            <div className="card card-teal" style={{padding:"14px 16px",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}><span style={{fontSize:32}}>{selWitness.avatar||"👤"}</span><div><div className="display" style={{fontSize:20,color:T.teal}}>{selWitness.name}</div><div style={{fontSize:12,color:T.inkSec,marginTop:2}}>{selWitness.role}</div><div style={{fontSize:11,color:T.inkMut,marginTop:3}}>{selWitness.summary}</div></div></div>
            </div>
            <div style={{marginBottom:10}}>
              <Lbl style={{marginBottom:7}}>Ask about...</Lbl>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{TRIGGERS.filter(t=>selWitness.statements?.some(s=>s.trigger===t.id)).map(t=><button key={t.id} className="btn btn-teal btn-sm" onClick={()=>callWitness(selWitness,t.id)} disabled={loading}>{t.icon} {t.label}</button>)}</div>
            </div>
            <div ref={chatRef} style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:8,marginBottom:10,minHeight:160,maxHeight:260}}>
              {hist.length===0&&<div style={{textAlign:"center",color:T.inkMut,fontSize:12,paddingTop:28}}>Select a topic or ask below.</div>}
              {hist.map((e,i)=>(
                <div key={i} style={{display:"flex",flexDirection:"column",gap:7}}>
                  {e.question&&<div style={{display:"flex",justifyContent:"flex-end"}}><div className="bubble bubble-user"><span style={{fontSize:10,color:T.teal,display:"block",marginBottom:2}}>{e.player}</span>{e.question}</div></div>}
                  <div style={{display:"flex",justifyContent:"flex-start"}}><div className="bubble bubble-ai"><span style={{fontSize:10,color:T.teal,display:"block",marginBottom:2}}>{selWitness.name}</span>{e.response}</div></div>
                </div>
              ))}
              {loading&&<div style={{display:"flex",gap:8,alignItems:"center"}}><span className="spinner"/><span style={{fontSize:11,color:T.inkMut}}>{selWitness.name} thinking...</span></div>}
            </div>
            <div style={{display:"flex",gap:8}}>
              <input className="input" placeholder={"Ask "+selWitness.name.split(" ")[0]+"..."} value={customQ} onChange={e=>setCustomQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&customQ.trim()&&!loading&&askCustom(selWitness,customQ)} style={{flex:1}}/>
              <button className="btn btn-teal" disabled={!customQ.trim()||loading} onClick={()=>askCustom(selWitness,customQ)}>{loading?<span className="spinner"/>:"Ask"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// INTERROG PANEL (tabs)
// ============================================================
function InterrogPanel(props){
  const {subTab,setSubTab,setShowDossier,setShowTimeline,suspects,questionCounts,dynamicAlibis,lieScores,crossState,patience}=props;
  return(
    <div>
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        {[["interrogate","💬","Interrogate","btn-gold"],["cross","⚔","Cross-Exam","btn-red"],["witnesses","👁","Witnesses","btn-teal"]].map(([id,icon,lbl,btn])=>(
          <button key={id} className={"btn btn-sm "+(subTab===id?btn:"btn-ghost")} onClick={()=>setSubTab(id)}>{icon} {lbl}</button>
        ))}
        <div style={{marginLeft:"auto",display:"flex",gap:6}}>
          <button className="btn btn-sm btn-ghost" onClick={()=>setShowDossier(props.selSuspect||suspects[0])}>📋 Dossier</button>
          <button className="btn btn-sm btn-ghost" onClick={()=>setShowTimeline(props.selSuspect||suspects[0])}>⏱ Timeline</button>
        </div>
      </div>
      {subTab==="interrogate"&&<InterrogationTab suspects={suspects} {...props}/>}
      {subTab==="cross"&&<CrossExamTab suspects={suspects} {...props}/>}
      {subTab==="witnesses"&&<WitnessTab witnesses={props.caseData.witnesses||[]} witnessState={props.witnessState} setWitnessState={props.setWitnessState} player={props.player} settings={props.settings}/>}
    </div>
  );
}

// ============================================================
// DOSSIER MODAL
// ============================================================
function DossierModal({suspect,dynamicAlibis,onClose}){
  if(!suspect)return null;
  const dos=suspect.dossier||{};
  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal anim-up" onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}><span style={{fontSize:44}}>{suspect.avatar||"👤"}</span><div><div className="display" style={{fontSize:28,color:T.gold}}>{suspect.name}</div><div style={{fontSize:13,color:T.inkSec}}>{suspect.role} · Age {suspect.age}</div></div></div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {dynamicAlibis[suspect.id]&&<div style={{padding:"8px 12px",background:T.amber+"10",border:"1px solid "+T.amber+"28",borderRadius:3,marginBottom:14,fontSize:12}}><span style={{color:T.amber,fontWeight:700}}>⚡ Alibi updated: </span>{dynamicAlibis[suspect.id]}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[["Background",dos.background],["Associates",dos.associates],["Record",dos.record],["Financials",dos.financials]].map(([k,v])=>v&&(
            <div key={k} style={{padding:"12px 14px",background:T.shadow,borderRadius:3,border:"1px solid #1F2330"}}>
              <Lbl style={{marginBottom:5}}>{k}</Lbl>
              <div style={{fontSize:12,color:T.inkSec,lineHeight:1.6}}>{v}</div>
            </div>
          ))}
        </div>
        {suspect.psych&&(
          <div style={{marginTop:12,padding:"12px 14px",background:T.purple+"08",borderRadius:3,border:"1px solid "+T.purple+"28"}}>
            <span className="tag tag-purple" style={{marginBottom:8,display:"inline-flex"}}>🧠 Psych Archetype</span>
            <div style={{fontSize:14,fontWeight:600,color:T.purple,marginBottom:6}}>{suspect.psych.archetype}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>{suspect.psych.traits?.map((t,i)=><span key={i} className="profiler-trait">{t}</span>)}</div>
            {suspect.psych.tell&&<div style={{fontSize:11,color:T.inkSec}}><span style={{color:T.purple}}>Tell: </span>{suspect.psych.tell}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// TIMELINE MODAL
// ============================================================
function TimelineModal({suspect,onClose}){
  if(!suspect)return null;
  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal anim-up" onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div><span className="tag tag-teal" style={{marginBottom:8,display:"inline-flex"}}>⏱ Timeline</span><h3 className="display" style={{fontSize:28,marginTop:6,color:T.teal}}>{suspect.name}</h3></div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{paddingLeft:20,borderLeft:"1px solid #1F2330"}}>
          {(suspect.timeline||[]).map((e,i)=>(
            <div key={i} style={{display:"flex",gap:14,marginBottom:16,position:"relative"}}>
              <div style={{position:"absolute",left:-24,top:4,width:9,height:9,borderRadius:"50%",background:T.teal,border:"2px solid #06080C"}}/>
              <div><div className="mono" style={{fontSize:12,color:T.teal,marginBottom:3}}>{e.t}</div><div style={{fontSize:13,color:T.inkSec,lineHeight:1.55}}>{e.a}</div></div>
            </div>
          ))}
          {!(suspect.timeline?.length)&&<p style={{color:T.inkMut,fontSize:13}}>No timeline data.</p>}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ACCUSE MODAL
// ============================================================
function AccuseModal({suspects,accusation,setAccusation,crossState,onConfirm,onClose,player}){
  return(
    <div className="overlay">
      <div className="modal anim-up">
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:40,marginBottom:10}}>⚖</div>
          <h3 className="display" style={{fontSize:36,color:T.red,marginBottom:6}}>FINAL ACCUSATION</h3>
          <p style={{color:T.inkSec,fontSize:13,lineHeight:1.7}}>One chance. Choose carefully, {player.name}.</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
          {suspects.map(s=>(
            <div key={s.id} className={"accuse-card "+(accusation===s.id?"selected":"")} onClick={()=>setAccusation(s.id)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}><span style={{fontSize:28}}>{s.avatar||"👤"}</span><div><div className="display" style={{fontSize:20}}>{s.name}</div><div style={{fontSize:12,color:T.inkSec}}>{s.role}</div>{crossState[s.id]?.cracked&&<span className="tag tag-red" style={{fontSize:9,marginTop:4}}>CRACKED</span>}</div></div>
                {accusation===s.id&&<span style={{color:T.red,fontSize:24}}>◉</span>}
              </div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10}}><button className="btn btn-red btn-lg" disabled={!accusation} onClick={onConfirm} style={{flex:1,justifyContent:"center"}}>CONFIRM ACCUSATION</button><button className="btn btn-ghost btn-lg" onClick={onClose}>Cancel</button></div>
      </div>
    </div>
  );
}

// ============================================================
// REVERSE INTERROGATION MODAL
// ============================================================
function ReverseModal({caseData,player,state,setState,onClose,diff,settings}){
  const ri=caseData.reverseInterrogation;
  const qList=ri?.questions?.slice(0,diff.reverseQ)||[];
  const curQ=qList[state.qIdx];
  const ref=useRef(null);
  useEffect(()=>{if(ref.current)ref.current.scrollTop=ref.current.scrollHeight;},[state.history]);
  const suspColor=state.suspicion<30?T.green:state.suspicion<60?T.amber:state.suspicion<80?T.orange:T.red;
  const handleSubmit=async()=>{
    const q=curQ,ans=state.ans.trim();
    if(!ans)return;
    setState(s=>Object.assign({},s,{loading:true,error:""}));
    const sys="You are a hard-boiled detective inspector grilling Detective "+player.name+". Alibi: "+ri.alibi+". Vulnerability: "+ri.secret+". Be adversarial, skeptical. Rate believability 1-10. Return ONLY JSON: {\"score\":7,\"response\":\"reaction.\"}";
    const raw=await callAI("Question: "+q+"\nAnswer: "+ans,sys,"reverse",settings);
    if(isAIErr(raw)){setState(s=>Object.assign({},s,{loading:false,error:raw.replace(AI_ERR,"").trim()}));return;}
    const parsed=safeJSON(raw,{score:5,response:"...noted."});
    const score=Math.min(10,Math.max(1,Number(parsed.score)||5));
    const delta=score>=7?-(Math.floor(Math.random()*15)+5):score>=4?Math.floor(Math.random()*8):Math.floor(Math.random()*20)+8;
    const newSusp=Math.min(100,Math.max(0,state.suspicion+delta));
    const isDone=state.qIdx>=qList.length-1;
    setState(s=>Object.assign({},s,{loading:false,error:"",history:[...s.history,{q,a:ans,aiResp:parsed.response||"...noted.",score,delta}],suspicion:newSusp,qIdx:s.qIdx+1,ans:"",done:isDone}));
    await speakText(parsed.response,settings);
  };
  return(
    <div className="overlay">
      <div className="modal modal-wide anim-up">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div><span className="tag tag-purple" style={{marginBottom:10,display:"inline-flex"}}>🎯 Reverse Interrogation</span><h3 className="display" style={{fontSize:28,color:T.purple,marginTop:6}}>YOU'RE IN THE HOT SEAT</h3></div>
          {state.done&&<button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>}
        </div>
        <div style={{marginBottom:12}}><SuspMeter value={state.suspicion} label={player.name+"'s Suspicion"}/></div>
        {state.error&&<div style={{background:T.red+"0E",border:"1px solid "+T.red+"33",borderRadius:4,padding:"10px 14px",marginBottom:10,fontSize:12,color:T.red}}>❌ {state.error}</div>}
        <div ref={ref} style={{height:200,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,marginBottom:12}}>
          {state.history.length===0&&!state.loading&&<div className="bubble bubble-system">The interrogator enters. The pressure is immediate.</div>}
          {state.history.map((e,i)=>(
            <div key={i} style={{display:"flex",flexDirection:"column",gap:7}}>
              <div style={{display:"flex",justifyContent:"flex-start"}}><div className="bubble bubble-reverse"><span style={{fontSize:10,color:T.purple,display:"block",marginBottom:3}}>Interrogator</span>{e.q}</div></div>
              <div style={{display:"flex",justifyContent:"flex-end"}}><div className="bubble bubble-user"><span style={{fontSize:10,color:T.teal,display:"block",marginBottom:3}}>{player.name}</span>{e.a}</div></div>
              <div style={{display:"flex",justifyContent:"flex-start"}}><div className="bubble" style={{background:e.delta>5?T.red+"10":T.purple+"10",border:"1px solid "+(e.delta>5?T.red:T.purple)+"28"}}><span style={{fontSize:10,color:e.delta>5?T.red:T.purple,display:"block",marginBottom:2}}>Credibility: {e.score}/10 · {e.delta>0?"▲ +"+e.delta+"%":"▼ "+Math.abs(e.delta)+"%"}</span>{e.aiResp}</div></div>
            </div>
          ))}
          {state.loading&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"6px 10px"}}><span className="spinner"/><span style={{fontSize:11,color:T.inkMut}}>Interrogator considering...</span></div>}
        </div>
        {!state.done&&curQ&&!state.loading?(
          <>
            <div className="card card-purple" style={{padding:"12px 14px",marginBottom:10}}><Lbl style={{marginBottom:6}}>Interrogator asks:</Lbl><p style={{fontSize:14,lineHeight:1.7,color:T.paper}}>{curQ}</p></div>
            <div style={{display:"flex",gap:8}}>
              <input className="input" placeholder="Your answer..." value={state.ans} onChange={e=>setState(s=>Object.assign({},s,{ans:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&state.ans.trim()&&handleSubmit()} style={{flex:1}}/>
              <button className="btn btn-purple" disabled={!state.ans.trim()||state.loading} onClick={handleSubmit}>Answer</button>
            </div>
          </>
        ):state.done?(
          <div style={{textAlign:"center"}}>
            <div style={{padding:20,background:suspColor+"10",border:"1px solid "+suspColor+"33",borderRadius:6,marginBottom:12}}>
              <div style={{fontSize:40,marginBottom:8}}>{state.suspicion<30?"✅":state.suspicion<60?"😬":"🚨"}</div>
              <div className="display" style={{fontSize:28,color:suspColor,marginBottom:5}}>FINAL SUSPICION: {state.suspicion}%</div>
              <p style={{fontSize:13,color:T.inkSec}}>{state.suspicion<30?"You held yourself together.":state.suspicion<60?"Shaky — they're watching you.":state.suspicion<80?"Under serious scrutiny.":"Solve this fast."}</p>
            </div>
            <button className="btn btn-teal btn-lg" onClick={onClose} style={{width:"100%",justifyContent:"center"}}>← Return to Investigation</button>
          </div>
        ):null}
      </div>
    </div>
  );
}

// ============================================================
// VERDICT SCREEN
// ============================================================
function VerdictScreen({verdict,caseData,player,onEnd}){
  const [phase,setPhase]=useState(0);
  const [tab,setTab]=useState("result");
  useEffect(()=>{const t1=setTimeout(()=>setPhase(1),300);const t2=setTimeout(()=>setPhase(2),1200);return()=>{clearTimeout(t1);clearTimeout(t2);};},[]);
  const isTimer=verdict.timerExpired,correct=verdict.correct;
  const bgColor=isTimer?T.amber:correct?T.green:T.red;
  const emoji=isTimer?"⌛":correct?"🏆":verdict.permadeath?"💀":"😞";
  return(
    <div className="verdict-bg" style={{background:"radial-gradient(ellipse 100% 60% at 50% 0%, "+bgColor+"12, transparent)"}}>
      <div style={{maxWidth:660,width:"100%",opacity:phase>=1?1:0,transform:phase>=1?"none":"translateY(30px)",transition:"all 0.8s cubic-bezier(0.16,1,0.3,1)"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:72,marginBottom:16}}>{emoji}</div>
          <span className={"tag tag-"+(isTimer?"amber":correct?"green":"red")} style={{marginBottom:16,display:"inline-flex",fontSize:11,padding:"5px 14px"}}>{isTimer?"TIME EXPIRED":correct?"CASE SOLVED":verdict.permadeath?"GAME OVER":"WRONG ACCUSATION"}</span>
          <h1 className="display" style={{fontSize:"clamp(36px,6vw,64px)",color:T.paper,marginBottom:10,lineHeight:1}}>{isTimer?"The killer escapes.":correct?"Brilliant work, Detective.":verdict.permadeath?"One shot. One miss.":"The real killer walks free."}</h1>
          <p style={{color:T.inkSec,fontSize:15,lineHeight:1.7}}>{isTimer?"The clock ran out. "+verdict.killer.name+" escapes.":correct?player.name+" correctly identified "+verdict.killer.name+".":player.name+" accused "+verdict.suspect?.name+". The killer was "+verdict.killer.name+"."}</p>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:24}}>
          {[["result","📊 Result"],["killerReveal","🎭 The Truth"],["stats","📈 Stats"]].map(([id,lbl])=>(
            <button key={id} className={"btn btn-sm "+(tab===id?"btn-teal":"btn-ghost")} onClick={()=>setTab(id)}>{lbl}</button>
          ))}
        </div>
        <div style={{opacity:phase>=2?1:0,transition:"opacity 0.6s ease 0.2s"}}>
          {tab==="result"&&(
            <div className="card" style={{padding:20,marginBottom:16}}>
              <Lbl style={{marginBottom:12}}>Investigation Summary</Lbl>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
                {[{l:"Evidence Found",v:(verdict.foundClues?.length||0)+" pieces"},{l:"Critical Clues",v:(verdict.foundClues?.filter(c=>c.critical).length||0)+" found"},{l:"Your Suspicion",v:(verdict.revSuspicion||0)+"%"}].map(({l,v})=>(
                  <div key={l} style={{textAlign:"center",padding:12,background:T.shadow,borderRadius:3}}>
                    <div className="mono" style={{fontSize:18,color:T.teal,marginBottom:4}}>{v}</div>
                    <Lbl>{l}</Lbl>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab==="killerReveal"&&verdict.killer&&(
            <div className="card card-red" style={{padding:20,marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16}}>
                <span style={{fontSize:48}}>{verdict.killer.avatar||"👤"}</span>
                <div>
                  <span className="tag tag-red" style={{marginBottom:6,display:"inline-flex"}}>THE KILLER</span>
                  <div className="display" style={{fontSize:28,color:T.red}}>{verdict.killer.name}</div>
                  <div style={{fontSize:13,color:T.inkSec}}>{verdict.killer.role}</div>
                </div>
              </div>
              <div style={{fontSize:13,color:T.inkSec,lineHeight:1.7,padding:"12px 14px",background:T.red+"08",borderRadius:3,border:"1px solid "+T.red+"20"}}>{verdict.reason}</div>
            </div>
          )}
          {tab==="stats"&&(
            <div className="card" style={{padding:20,marginBottom:16}}>
              <Lbl style={{marginBottom:12}}>Evidence Collected</Lbl>
              {verdict.foundClues?.map(c=>(
                <div key={c.id} style={{display:"flex",gap:10,marginBottom:8,padding:"8px 10px",background:T.shadow,borderRadius:3}}>
                  <span>{c.critical?"🔑":"🔎"}</span>
                  <div><div style={{fontSize:12,fontWeight:600,color:c.critical?T.gold:T.ink}}>{c.name}</div><div style={{fontSize:11,color:T.inkSec}}>{c.desc}</div></div>
                </div>
              ))}
              {!verdict.foundClues?.length&&<div style={{color:T.inkMut,fontSize:13}}>No evidence collected.</div>}
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button className="btn btn-teal btn-lg" onClick={()=>onEnd("lobby")}>🔍 New Case</button>
          <button className="btn btn-ghost btn-lg" onClick={()=>onEnd("home")}>← Home</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SPLASH
// ============================================================
function SplashScreen({onDone}){
  const [phase,setPhase]=useState(0);
  useEffect(()=>{
    const t1=setTimeout(()=>setPhase(1),400);
    const t2=setTimeout(()=>setPhase(2),1100);
    const t3=setTimeout(()=>setPhase(3),1800);
    const t4=setTimeout(()=>onDone(),2800);
    return()=>{[t1,t2,t3,t4].forEach(clearTimeout);};
  },[]);
  return(
    <div className="splash-bg">
      <div className="splash-grid"/><div className="splash-scanline"/>
      <div style={{textAlign:"center",position:"relative",zIndex:1}}>
        <div style={{opacity:phase>=1?1:0,transform:phase>=1?"none":"translateY(30px)",transition:"all 0.7s cubic-bezier(0.16,1,0.3,1)"}}>
          <div className="mono" style={{fontSize:10,color:T.teal,letterSpacing:"0.3em",marginBottom:20,opacity:0.7}}>INITIALIZING CASE FILES...</div>
          <div className="display" style={{fontSize:"clamp(64px,14vw,128px)",color:T.paper,lineHeight:0.85}}>CASE<span style={{color:T.teal}}>ZERO</span></div>
        </div>
        <div style={{marginTop:20,opacity:phase>=2?1:0,transition:"opacity 0.6s ease 0.1s"}}>
          <div className="noir" style={{fontSize:18,color:T.inkSec}}>Every case has a zero hour.</div>
        </div>
        <div style={{marginTop:32,opacity:phase>=3?1:0,transition:"opacity 0.5s ease"}}>
          <div style={{display:"flex",justifyContent:"center",gap:6}}>
            {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:T.teal,opacity:0.4,animation:"breathe 1.4s ease infinite",animationDelay:i*0.2+"s"}}/>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LANDING
// ============================================================
function LandingScreen({onStart}){
  return(
    <div style={{maxWidth:1000,margin:"0 auto",padding:"48px 24px"}}>
      <div className="anim-up" style={{marginBottom:52,textAlign:"center"}}>
        <span className="tag tag-teal" style={{marginBottom:18,display:"inline-flex"}}>V3 · POWERED BY CLAUDE AI</span>
        <h1 className="display" style={{fontSize:"clamp(52px,9vw,96px)",color:T.paper,marginBottom:14,lineHeight:0.88}}>CASE<span style={{color:T.teal}}>ZERO</span></h1>
        <p className="noir" style={{fontSize:20,color:T.inkSec,maxWidth:480,margin:"0 auto",lineHeight:1.6}}>The city has a new detective. The suspects don't know it's you.</p>
      </div>
      <div className="anim-up" style={{animationDelay:"0.1s",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:48}}>
        {[["🎭","AI Suspects","Dynamic memory, mood shifts, and back-questions"],["👆","Fingerprint Lab","Scan and match prints with drag mechanic"],["🔦","UV Evidence","Sweep UV torch to reveal hidden traces"],["📺","News Ticker","Escalating headlines pressure you mid-case"],["🗺","Scene Map","Top-down floor plan to navigate rooms"],["📷","Crime Photos","Polaroid wall of crime scene stills"],["😊😡","Good/Bad Cop","Switch interrogation tactics mid-session"],["⚖","Patience Meter","Push too hard and suspects lawyer up"],["💥","Slip Detection","AI flags near-confessions in real time"]].map(([i,t,d])=>(
          <div key={t} className="card" style={{padding:"16px 14px",textAlign:"center"}}>
            <div style={{fontSize:26,marginBottom:8}}>{i}</div>
            <div style={{fontSize:11,fontWeight:700,color:T.paper,marginBottom:4,letterSpacing:"0.04em"}}>{t}</div>
            <div style={{fontSize:10,color:T.inkSec,lineHeight:1.5}}>{d}</div>
          </div>
        ))}
      </div>
      <div className="anim-up" style={{animationDelay:"0.18s",display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        <button className="btn btn-teal btn-xl" onClick={()=>onStart("lobby")}>▶ BEGIN INVESTIGATION</button>
        <button className="btn btn-ghost btn-xl" onClick={()=>onStart("settings")}>⚙ SETTINGS</button>
      </div>
    </div>
  );
}

// ============================================================
// SETTINGS
// ============================================================
function SettingsScreen({settings,onChange,onBack}){
  const [testStatus,setTestStatus]=useState("");
  const [testing,setTesting]=useState(false);
  const test=async()=>{
    setTesting(true);setTestStatus("");
    const r=await callAI("Reply with exactly: Connection OK","Reply with: Connection OK","test",settings);
    setTestStatus(isAIErr(r)?"❌ "+r.replace(AI_ERR,"").trim():"✅ Connected");
    setTesting(false);
  };
  const set=(k,v)=>onChange(Object.assign({},settings,{[k]:v}));
  return(
    <div style={{maxWidth:640,margin:"0 auto",padding:"32px 24px"}}>
      <button className="btn btn-ghost btn-sm" style={{marginBottom:28}} onClick={onBack}>← Back</button>
      <h2 className="display" style={{fontSize:42,color:T.paper,marginBottom:4}}>SETTINGS</h2>
      <p style={{color:T.inkSec,marginBottom:28,fontSize:14}}>Configure Claude AI model and game options.</p>
      <div className="card" style={{padding:20,marginBottom:14}}>
        <Lbl style={{marginBottom:10}}>Claude Model</Lbl>
        <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>
          {CLAUDE_MODELS.map(m=>(
            <div key={m.id} className={"model-row "+(settings.claudeModel===m.id?"active":"")} onClick={()=>set("claudeModel",m.id)}>
              <div style={{width:8,height:8,borderRadius:"50%",flexShrink:0,background:m.tier==="advanced"?T.purple:m.tier==="fast"?T.green:T.teal}}/>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:settings.claudeModel===m.id?T.teal:T.ink}}>{m.label}</div><div style={{fontSize:11,color:T.inkSec}}>{m.desc}</div></div>
              {settings.claudeModel===m.id&&<span style={{color:T.teal,fontSize:14}}>✓</span>}
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button className="btn btn-ghost btn-sm" onClick={test} disabled={testing}>{testing?<><span className="spinner"/>Testing...</>:"🔌 Test Connection"}</button>
          {testStatus&&<span style={{fontSize:12,color:testStatus.startsWith("✅")?T.green:T.red}}>{testStatus}</span>}
        </div>
      </div>
      <div className="card" style={{padding:20}}>
        <Lbl style={{marginBottom:14}}>Game Options</Lbl>
        {[
          {k:"aiHints",l:"AI Hint System",d:"Request a subtle hint once per round"},
          {k:"lieDetector",l:"AI Lie Detector",d:"Scores deception % after each answer"},
          {k:"narratorEnabled",l:"AI Noir Narrator",d:"Atmospheric one-liner between phases"},
          {k:"psychProfiler",l:"Psych Profiler",d:"Reveal suspect psychological archetype & tells"},
          {k:"autoNotes",l:"Auto Case Notes",d:"AI auto-logs key discoveries"},
          {k:"newsTicker",l:"News Ticker",d:"Escalating headlines that affect suspects"},
          {k:"pressureEvents",l:"Pressure Events",d:"Mid-game urgency alerts from HQ"},
        ].map(o=>(
          <label key={o.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,marginBottom:14,cursor:"pointer"}}>
            <div><div style={{fontSize:14,fontWeight:500}}>{o.l}</div><div style={{fontSize:12,color:T.inkSec}}>{o.d}</div></div>
            <Toggle on={settings[o.k]} onChange={()=>set(o.k,!settings[o.k])}/>
          </label>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// LOBBY
// ============================================================
function LobbyScreen({settings,onStart,onBack}){
  const [players,setPlayers]=useState([{id:1,name:"Detective 1",color:PLAYER_COLORS[0]}]);
  const [newName,setNewName]=useState("");
  const [mode,setMode]=useState("combined");
  const [diff,setDiff]=useState("medium");
  const [timerOvr,setTimerOvr]=useState(-1);
  const [selCase,setSelCase]=useState(CASES[0]);
  const [gen,setGen]=useState(false);
  const [genErr,setGenErr]=useState("");
  const [showCustom,setShowCustom]=useState(false);
  const [customPrompt,setCustomPrompt]=useState("");
  const d=DIFFICULTY[diff];
  const timerMins=timerOvr>=0?timerOvr:d.timer;
  const addPlayer=()=>{
    if(players.length>=8)return;
    const name=newName.trim()||"Detective "+(players.length+1);
    setPlayers(p=>[...p,{id:Date.now(),name,color:PLAYER_COLORS[p.length%8]}]);
    setNewName("");
  };
  const generateCase=async()=>{
    setGen(true);setGenErr("");
    const prompt='Create a detective mystery. Return ONLY valid compact JSON:\n{"id":"c'+Date.now()+'","title":"Title","setting":"Setting","badge":"🔍","difficulty":"medium","summary":"Hook","victim":"Name age role","cause":"Method","killer":"Name","killerReason":"Motive","narratorIntro":"Noir intro","polaroids":[{"id":"p1","label":"Label","caption":"Caption","emoji":"🔎"}],"suspects":[{"id":"s1","name":"Name","role":"Role","age":35,"avatar":"👤","guilty":true,"alibi":"Alibi","secret":"Secret","psych":{"archetype":"Label","traits":["Trait1"],"tell":"Tell"},"dossier":{"background":"","associates":"","record":"","financials":""},"timeline":[{"t":"9pm","a":"Action"}],"fingerprint":"loop","uvClue":"Nothing unusual detected"},{"id":"s2","name":"Name","role":"Role","age":40,"avatar":"👤","guilty":false,"alibi":"Alibi","secret":"Secret","psych":{"archetype":"Label","traits":["Trait1"],"tell":"Tell"},"dossier":{"background":"","associates":"","record":"","financials":""},"timeline":[],"fingerprint":"whorl","uvClue":"Nothing unusual detected"}],"clues":[{"id":"c1","name":"Clue","desc":"Detail","critical":true,"room":"Room A","found":false,"hasFingerprint":true,"hasUV":true},{"id":"c2","name":"Clue","desc":"Detail","critical":false,"room":"Room B","found":false,"hasFingerprint":false,"hasUV":false}],"rooms":["Room A","Room B"],"witnesses":[{"id":"w1","name":"Name","role":"Role","avatar":"👤","summary":"Line","statements":[{"trigger":"general","text":"Statement"}]}],"interrogationQuestions":{"s1":[{"q":"Q?"}]},"reverseInterrogation":{"alibi":"Claim","secret":"Weakness","questions":["Q1?","Q2?"]},"crossExam":{"s1":{"contradiction":"Contradiction","pressure":"Point","threshold":2}},"cctv":"Footage description."}\nTheme: '+(customPrompt||"Murder at a private members club")+'. Be original and noir.';
    const raw=await callAI(prompt,"Return ONLY valid compact JSON. No markdown.","case-gen",settings);
    if(isAIErr(raw)){setGenErr(raw.replace(AI_ERR,"").trim());setGen(false);return;}
    const parsed=safeJSON(raw);
    if(parsed._error||parsed._parseError){setGenErr(parsed._error||"JSON parse failed.");setGen(false);return;}
    parsed.suspects&&parsed.suspects.forEach(s=>{
      s.dossier=s.dossier||{background:"",associates:"",record:"None",financials:""};
      s.timeline=s.timeline||[];
      s.psych=s.psych||{archetype:"Unknown",traits:[],tell:"No obvious tell"};
      s.fingerprint=s.fingerprint||"loop";
      s.uvClue=s.uvClue||"Nothing unusual detected";
    });
    parsed.witnesses=parsed.witnesses||[];
    parsed.reverseInterrogation=parsed.reverseInterrogation||{alibi:"",secret:"",questions:["Where were you?","Why this case?"]};
    parsed.crossExam=parsed.crossExam||{};
    parsed.polaroids=parsed.polaroids||[];
    parsed.cctv=parsed.cctv||"No CCTV footage on file.";
    setSelCase(parsed);setShowCustom(false);setGen(false);
  };
  const MODES=[{id:"detective",icon:"🔍",l:"Detective",d:"Explore rooms and find evidence"},{id:"interrogation",icon:"💬",l:"Interrogation",d:"AI suspects, witnesses, cross-exam"},{id:"combined",icon:"🗂",l:"Full Investigation ★",d:"Everything — detect, interrogate, forensics, grill"}];
  return(
    <div style={{maxWidth:960,margin:"0 auto",padding:"32px 24px"}}>
      <button className="btn btn-ghost btn-sm" style={{marginBottom:28}} onClick={onBack}>← Back</button>
      <div style={{marginBottom:28}}>
        <h2 className="display" style={{fontSize:42,color:T.paper,marginBottom:4}}>MISSION BRIEFING</h2>
        <p style={{color:T.inkSec,fontSize:14}}>Configure your team, difficulty, and case.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div className="card" style={{padding:20}}>
          <Lbl style={{marginBottom:12}}>Detectives ({players.length}/8)</Lbl>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
            {players.map(p=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:9,height:9,borderRadius:"50%",background:p.color,flexShrink:0}}/>
                <span style={{flex:1,fontSize:13}}>{p.name}</span>
                {players.length>1&&<button className="btn btn-ghost btn-sm" style={{padding:"2px 8px",fontSize:10}} onClick={()=>setPlayers(pl=>pl.filter(x=>x.id!==p.id))}>✕</button>}
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <input className="input" placeholder="Player name" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPlayer()} style={{flex:1}}/>
            <button className="btn btn-teal" onClick={addPlayer} disabled={players.length>=8}>+</button>
          </div>
        </div>
        <div className="card" style={{padding:20}}>
          <Lbl style={{marginBottom:12}}>Game Mode</Lbl>
          {MODES.map(m=>(
            <div key={m.id} onClick={()=>setMode(m.id)} style={{padding:"10px 14px",borderRadius:3,cursor:"pointer",marginBottom:7,border:"1px solid "+(mode===m.id?T.teal:"#1F2330"),background:mode===m.id?T.teal+"0A":T.shadow,transition:"all 0.15s"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:17}}>{m.icon}</span>
                <div><div style={{fontSize:13,fontWeight:600,color:mode===m.id?T.teal:T.ink}}>{m.l}</div><div style={{fontSize:11,color:T.inkSec}}>{m.d}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{padding:20,marginBottom:14}}>
        <Lbl style={{marginBottom:12}}>Difficulty</Lbl>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
          {Object.values(DIFFICULTY).map(dv=>(
            <div key={dv.id} className={"diff-card "+(diff===dv.id?"selected":"")} onClick={()=>setDiff(dv.id)}>
              <div style={{fontSize:22,marginBottom:6}}>{dv.icon}</div>
              <div style={{fontSize:14,fontWeight:700,color:diff===dv.id?T.gold:T.ink,marginBottom:4}}>{dv.label}</div>
              <div style={{fontSize:11,color:T.inkSec,lineHeight:1.5}}>{dv.desc}</div>
              {dv.permadeath&&<span className="tag tag-red" style={{marginTop:6,fontSize:9}}>PERMADEATH</span>}
            </div>
          ))}
        </div>
        <Lbl style={{marginBottom:8}}>Case Timer</Lbl>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {TIMER_OPTS.map(t=>(
            <button key={t.v} className={"btn btn-sm "+(timerOvr===t.v?"btn-teal":"btn-ghost")} onClick={()=>setTimerOvr(t.v)}>{t.l}{t.v>0&&t.v===d.timer?" ★":""}</button>
          ))}
        </div>
        <div style={{fontSize:11,color:T.inkMut,marginTop:7}}>Timer: {timerMins===0?"Off":timerMins+" minutes"}</div>
      </div>
      <div className="card" style={{padding:20,marginBottom:18}}>
        <Lbl style={{marginBottom:12}}>Select Case</Lbl>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
          {CASES.map(c=>(
            <div key={c.id} className={"case-select-card "+(selCase?.id===c.id?"selected":"")} onClick={()=>setSelCase(c)}>
              <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                <div style={{fontSize:26,flexShrink:0}}>{c.badge||"🔍"}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <div style={{fontSize:15,fontWeight:700,color:selCase?.id===c.id?T.gold:T.ink}}>{c.title}</div>
                    <span className={"tag tag-"+(c.difficulty==="hard"?"red":c.difficulty==="easy"?"green":"amber")} style={{fontSize:8}}>{c.difficulty||"medium"}</span>
                  </div>
                  <div style={{fontSize:12,color:T.inkSec,marginBottom:6,lineHeight:1.5}}>{c.summary}</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    <span className="tag tag-muted" style={{fontSize:9}}>{c.suspects?.length} suspects</span>
                    <span className="tag tag-muted" style={{fontSize:9}}>{c.clues?.length} clues</span>
                    <span className="tag tag-teal" style={{fontSize:9}}>{c.witnesses?.length||0} witnesses</span>
                  </div>
                </div>
                {selCase?.id===c.id&&<div style={{width:8,height:8,borderRadius:"50%",background:T.gold,flexShrink:0,marginTop:4}}/>}
              </div>
            </div>
          ))}
          <div onClick={()=>setShowCustom(true)} style={{padding:"14px 18px",borderRadius:3,cursor:"pointer",border:"1px dashed #1F2330",background:T.shadow,display:"flex",alignItems:"center",gap:14,transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#42475A"} onMouseLeave={e=>e.currentTarget.style.borderColor="#1F2330"}>
            <span style={{fontSize:26}}>✨</span>
            <div><div style={{fontSize:14,fontWeight:600,color:T.inkSec,marginBottom:2}}>AI-Generated Case</div><div style={{fontSize:12,color:T.inkMut}}>Claude builds a custom mystery from your theme</div></div>
          </div>
        </div>
      </div>
      <button className="btn btn-gold btn-lg" style={{width:"100%",fontSize:14,letterSpacing:"0.12em",justifyContent:"center"}} disabled={!selCase} onClick={()=>onStart({players,caseData:selCase,gameMode:mode,difficulty:diff,timerMinutes:timerMins})}>▶ BEGIN INVESTIGATION</button>
      {showCustom&&(
        <div className="overlay" onClick={()=>setShowCustom(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3 className="display" style={{fontSize:32,marginBottom:8}}>AI CASE GENERATOR</h3>
            <p style={{color:T.inkSec,fontSize:13,marginBottom:14}}>Describe a theme. Claude builds the full mystery.</p>
            <textarea className="input" placeholder="e.g. 'Spy thriller on a 1940s Orient Express'" value={customPrompt} onChange={e=>setCustomPrompt(e.target.value)} style={{marginBottom:12}}/>
            {genErr&&<div style={{color:T.red,fontSize:12,marginBottom:10,padding:"8px 12px",background:T.red+"0A",borderRadius:4}}>❌ {genErr}</div>}
            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-gold" onClick={generateCase} disabled={gen} style={{flex:1,justifyContent:"center"}}>{gen?<><span className="spinner"/>Generating...</>:"✨ Generate Case"}</button>
              <button className="btn btn-ghost" onClick={()=>setShowCustom(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// GAME SCREEN — master controller
// ============================================================
const PRESSURE_EVENTS=[
  {id:"pe1",trigger:30,message:"The DA's office just called. They want a name within the hour.",effect:"Suspect patience reduced by 1 across all suspects."},
  {id:"pe2",trigger:55,message:"A witness has gone quiet. Rumour is someone got to them.",effect:"One witness becomes unavailable."},
  {id:"pe3",trigger:75,message:"Breaking: a suspect was spotted near the exit with luggage.",effect:"Killer suspect patience drops to 1."},
  {id:"pe4",trigger:90,message:"Chief Inspector on scene. This is your last chance to make an arrest.",effect:"Final warning — accusation window closing."},
];

function GameScreen({gameState,settings,onEnd}){
  const {players,caseData,gameMode,difficulty,timerMinutes}=gameState;
  const diff=DIFFICULTY[difficulty]||DIFFICULTY.medium;
  const [phase,setPhase]=useState(gameMode==="interrogation"?"interrogation":"detective");
  const [curPlayer,setCurPlayer]=useState(0);
  const [clues,setClues]=useState(()=>{
    let c=caseData.clues.map(x=>Object.assign({},x));
    if(diff.freeClues>0){let g=0;c=c.map(x=>{if(!x.found&&x.critical&&g<diff.freeClues){g++;return Object.assign({},x,{found:true});}return x;});}
    return c;
  });
  const [notes,setNotes]=useState({});
  const [caseNotes,setCaseNotes]=useState([]);
  const [activeRoom,setActiveRoom]=useState(caseData.rooms[0]);
  const [selSuspect,setSelSuspect]=useState(null);
  const [interrogHist,setInterrogHist]=useState({});
  const [questionCounts,setQuestionCounts]=useState({});
  const [dynamicAlibis,setDynamicAlibis]=useState({});
  const [lieScores,setLieScores]=useState({});
  const [patience,setPatience]=useState(()=>{
    const p={};caseData.suspects.forEach(s=>{p[s.id]=diff.patienceBase;});return p;
  });
  const [crossState,setCrossState]=useState({});
  const [witnessState,setWitnessState]=useState({});
  const [subTab,setSubTab]=useState("interrogate");
  const [hint,setHint]=useState("");
  const [hintUsed,setHintUsed]=useState(false);
  const [hintLoading,setHintLoading]=useState(false);
  const [showHint,setShowHint]=useState(false);
  const [narrator,setNarrator]=useState({text:caseData.narratorIntro||"",loading:false});
  const [showAccuse,setShowAccuse]=useState(false);
  const [accusation,setAccusation]=useState(null);
  const [showReverse,setShowReverse]=useState(false);
  const [revState,setRevState]=useState({suspicion:15,history:[],qIdx:0,ans:"",loading:false,done:false,error:""});
  const [showDossier,setShowDossier]=useState(null);
  const [showTimeline,setShowTimeline]=useState(null);
  const [verdict,setVerdict]=useState(null);
  const [isMobile,setIsMobile]=useState(false);
  const [isTV,setIsTV]=useState(false);
  // new feature state
  const [showMap,setShowMap]=useState(false);
  const [showCCTV,setShowCCTV]=useState(false);
  const [showPolaroids,setShowPolaroids]=useState(false);
  const [elapsedPct,setElapsedPct]=useState(0);
  const [newsUrgency,setNewsUrgency]=useState("low");
  const [pressureEvent,setPressureEvent]=useState(null);
  const [firedEvents,setFiredEvents]=useState([]);
  const startTime=useRef(Date.now());
  const totalMs=(timerMinutes||20)*60*1000;
  const player=players[curPlayer];
  const foundClues=clues.filter(c=>c.found);
  const progress=Math.round((foundClues.length/clues.length)*100);

  useEffect(()=>{
    const check=()=>{setIsTV(window.innerWidth>=1400);setIsMobile(window.innerWidth<768);};
    check();window.addEventListener("resize",check);return()=>window.removeEventListener("resize",check);
  },[]);

  // Track elapsed time for news ticker
  useEffect(()=>{
    if(!settings.newsTicker&&!settings.pressureEvents)return;
    const int=setInterval(()=>{
      const pct=Math.min(100,((Date.now()-startTime.current)/totalMs)*100);
      setElapsedPct(pct);
      // Pressure events
      if(settings.pressureEvents){
        PRESSURE_EVENTS.forEach(ev=>{
          if(pct>=ev.trigger&&!firedEvents.includes(ev.id)){
            setFiredEvents(f=>[...f,ev.id]);
            setPressureEvent(ev);
            // Apply patience effect
            if(ev.id==="pe1")setPatience(p=>{const n={};Object.keys(p).forEach(k=>{n[k]=Math.max(0,p[k]-1);});return n;});
            if(ev.id==="pe3"){const killer=caseData.suspects.find(s=>s.guilty);if(killer)setPatience(p=>Object.assign({},p,{[killer.id]:Math.min(1,p[killer.id]||1)}));}
          }
        });
      }
    },3000);
    return()=>clearInterval(int);
  },[settings.newsTicker,settings.pressureEvents,firedEvents,totalMs]);

  // Escalation effect on suspects
  useEffect(()=>{
    if(newsUrgency==="high"||newsUrgency==="critical"){
      // All suspects lose 1 patience when news escalates
      setPatience(p=>{const n={};Object.keys(p).forEach(k=>{n[k]=Math.max(0,p[k]-1);});return n;});
    }
  },[newsUrgency]);

  useEffect(()=>{
    if(!settings.narratorEnabled)return;
    const sys="You are a hardboiled noir narrator. One atmospheric sentence, 15-25 words, present tense. No quotes.";
    const pr="Case: "+caseData.title+". Phase: "+phase+". Clues found: "+(foundClues.map(c=>c.name).join(", ")||"none")+".";
    setNarrator(n=>Object.assign({},n,{loading:true}));
    callAI(pr,sys,"narrator",settings).then(txt=>setNarrator({text:isAIErr(txt)?"The investigation continues...":txt,loading:false}));
  },[phase]);

  const addNote=(text)=>{
    const time=new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
    setCaseNotes(n=>[...n,{text,time}]);
  };
  const discoverClue=c=>{
    setClues(prev=>prev.map(x=>x.id===c.id?Object.assign({},x,{found:true}):x));
    if(settings.autoNotes)addNote("Discovered: "+c.name+(c.critical?" [CRITICAL]":"")+" in "+c.room);
  };
  const getHint=async()=>{
    if(!diff.unlimitedHints&&hintUsed)return;
    setHintLoading(true);
    const found=foundClues.map(c=>c.name).join(",")||"nothing";
    const h=await callAI("Detective found: "+found+". One cryptic noir hint 20 words max.","You are the game master. Subtle cryptic noir hints only.","hint",settings);
    setHint(isAIErr(h)?"Look closer at what's already in front of you.":h);
    setHintUsed(true);setShowHint(true);setHintLoading(false);
  };
  const submitAccusation=()=>{
    const s=caseData.suspects.find(x=>x.id===accusation);
    if(diff.permadeath&&!s.guilty){setVerdict({correct:false,permadeath:true,suspect:s,killer:caseData.suspects.find(x=>x.guilty),reason:caseData.killerReason,foundClues,revSuspicion:revState.suspicion,players});setShowAccuse(false);return;}
    setVerdict({correct:s.guilty,suspect:s,killer:caseData.suspects.find(x=>x.guilty),reason:caseData.killerReason,foundClues,revSuspicion:revState.suspicion,players});
    setShowAccuse(false);
  };
  const handleTimerExpire=()=>setVerdict({timerExpired:true,correct:false,suspect:null,killer:caseData.suspects.find(x=>x.guilty),reason:caseData.killerReason,foundClues,revSuspicion:revState.suspicion,players});

  if(verdict)return<VerdictScreen verdict={verdict} caseData={caseData} player={player} onEnd={onEnd}/>;

  const shared={caseData,suspects:caseData.suspects,selSuspect,setSelSuspect,interrogHist,setInterrogHist,questionCounts,setQuestionCounts,dynamicAlibis,setDynamicAlibis,lieScores,setLieScores,patience,setPatience,crossState,setCrossState,witnessState,setWitnessState,player,settings,diff};
  const sidebarP={caseData,foundClues,clues,progress,revSuspicion:revState.suspicion,hint,showHint,hintUsed,hintLoading,getHint,unlimitedHints:diff.unlimitedHints,aiHints:settings.aiHints,notes:caseNotes,onAddNote:addNote,onShowMap:()=>setShowMap(true)};

  return(
    <div style={{minHeight:"100vh",paddingBottom:isMobile?80:0}}>
      {/* TOP NAV */}
      <div className="top-nav">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span className="display" style={{fontSize:22,color:T.paper}}>CASE<span style={{color:T.teal}}>ZERO</span></span>
          <span className="tag tag-gold" style={{fontSize:8}}>{caseData.title}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
          {timerMinutes>0&&<CaseTimer minutes={timerMinutes} onExpire={handleTimerExpire} paused={!!verdict}/>}
          {players.length>1&&players.map((p,i)=>(
            <div key={p.id} className="player-chip" style={{opacity:i===curPlayer?1:0.4,borderColor:i===curPlayer?p.color:"#1F2330"}} onClick={()=>setCurPlayer(i)}>
              <div style={{width:7,height:7,borderRadius:"50%",background:p.color}}/><span style={{fontSize:11}}>{p.name}</span>
            </div>
          ))}
          {!isMobile&&gameMode==="combined"&&<div style={{display:"flex",gap:4}}>{[["detective","🔍"],["interrogation","💬"]].map(([id,icon])=><button key={id} className={"btn btn-sm "+(phase===id?"btn-teal":"btn-ghost")} onClick={()=>setPhase(id)}>{icon}</button>)}</div>}
          <button className="btn btn-sm btn-ghost" onClick={()=>setShowMap(true)}>🗺</button>
          <button className="btn btn-sm btn-ghost" onClick={()=>setShowCCTV(true)}>📹</button>
          <button className="btn btn-sm btn-ghost" onClick={()=>setShowPolaroids(true)}>📷</button>
          <button className="btn btn-sm btn-purple" onClick={()=>setShowReverse(true)}>🎯</button>
          <button className="btn btn-sm btn-red" onClick={()=>setShowAccuse(true)}>⚖ Accuse</button>
        </div>
      </div>

      {/* NEWS TICKER — Feature #21 */}
      {settings.newsTicker&&<NewsTicker elapsedPct={elapsedPct} caseData={caseData} onEscalate={setNewsUrgency}/>}

      {/* NARRATOR */}
      {settings.narratorEnabled&&<NarratorBar text={narrator.text} loading={narrator.loading}/>}

      {/* PRESSURE EVENT — Feature #27 */}
      {pressureEvent&&<PressureEvent event={pressureEvent} onDismiss={()=>setPressureEvent(null)}/>}

      {/* MAIN LAYOUT */}
      {isTV?(
        <div style={{display:"grid",gridTemplateColumns:"280px 1fr 260px",gap:18,padding:"18px 24px"}}>
          <div style={{overflowY:"auto"}}><Sidebar {...sidebarP}/></div>
          <div style={{overflowY:"auto"}}>
            {gameMode==="combined"&&<div style={{display:"flex",gap:7,marginBottom:14}}>{[["detective","🔍","Detect"],["interrogation","💬","Interrogate"]].map(([id,icon,lbl])=><button key={id} className={"btn "+(phase===id?"btn-teal":"btn-ghost")} style={{fontSize:13}} onClick={()=>setPhase(id)}>{icon} {lbl}</button>)}</div>}
            {phase==="detective"&&<CorkboardPanel caseData={caseData} clues={clues} activeRoom={activeRoom} setActiveRoom={setActiveRoom} discoverClue={discoverClue} notes={notes} setNotes={setNotes} settings={settings} onShowMap={()=>setShowMap(true)} onShowCCTV={()=>setShowCCTV(true)} onShowPolaroids={()=>setShowPolaroids(true)}/>}
            {phase==="interrogation"&&<InterrogPanel subTab={subTab} setSubTab={setSubTab} setShowDossier={setShowDossier} setShowTimeline={setShowTimeline} suspects={caseData.suspects} questionCounts={questionCounts} dynamicAlibis={dynamicAlibis} lieScores={lieScores} crossState={crossState} {...shared}/>}
          </div>
          <div style={{overflowY:"auto"}}>
            <Lbl style={{marginBottom:10}}>Suspects</Lbl>
            {caseData.suspects.map(s=>{
              const cs=crossState[s.id]||{},qc=questionCounts[s.id]||0,sp=patience[s.id]??diff.patienceBase;
              return(
                <div key={s.id} className={"portrait-card "+(selSuspect?.id===s.id?"selected ":"")+(cs.cracked?"cracked ":"")+(sp<=0?"lawyered":"")} style={{marginBottom:10,cursor:"pointer"}} onClick={()=>{setSelSuspect(s);if(phase!=="interrogation")setPhase("interrogation");}}>
                  <div className="portrait-avatar" style={{height:64,fontSize:32}}>{s.avatar||"👤"}</div>
                  <div className="portrait-body" style={{padding:"10px 12px"}}>
                    <div className="portrait-name" style={{fontSize:16}}>{s.name}</div>
                    <div className="portrait-role" style={{marginBottom:6}}>{s.role}</div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {qc>0&&<MoodBadge count={qc} guilty={s.guilty} patience={sp}/>}
                      {cs.cracked&&<span className="tag tag-red" style={{fontSize:8}}>CRACKED</span>}
                      {sp<=0&&<span className="tag tag-purple" style={{fontSize:8}}>LAWYERED</span>}
                      {dynamicAlibis[s.id]&&<span className="tag tag-amber" style={{fontSize:8}}>⚡</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ):(
        <div style={{maxWidth:1200,margin:"0 auto",padding:"16px 14px",display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"250px 1fr",gap:16}}>
          {!isMobile&&<Sidebar {...sidebarP}/>}
          <div>
            {phase==="detective"&&<CorkboardPanel caseData={caseData} clues={clues} activeRoom={activeRoom} setActiveRoom={setActiveRoom} discoverClue={discoverClue} notes={notes} setNotes={setNotes} settings={settings} onShowMap={()=>setShowMap(true)} onShowCCTV={()=>setShowCCTV(true)} onShowPolaroids={()=>setShowPolaroids(true)}/>}
            {phase==="interrogation"&&<InterrogPanel subTab={subTab} setSubTab={setSubTab} setShowDossier={setShowDossier} setShowTimeline={setShowTimeline} {...shared}/>}
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAV */}
      {isMobile&&gameMode==="combined"&&(
        <div className="bottom-nav">
          {[["detective","🔍","Explore"],["interrogation","💬","Interrogate"]].map(([id,icon,lbl])=>(
            <div key={id} className={"bnav-item "+(phase===id?"active":"")} onClick={()=>setPhase(id)}><div className="bnav-icon">{icon}</div><div className="bnav-label">{lbl}</div></div>
          ))}
          <div className="bnav-item" onClick={()=>setShowMap(true)}><div className="bnav-icon">🗺</div><div className="bnav-label">Map</div></div>
          <div className="bnav-item" onClick={()=>setShowAccuse(true)}><div className="bnav-icon">⚖</div><div className="bnav-label" style={{color:T.red}}>Accuse</div></div>
        </div>
      )}

      {/* MODALS */}
      {showAccuse&&<AccuseModal suspects={caseData.suspects} accusation={accusation} setAccusation={setAccusation} crossState={crossState} onConfirm={submitAccusation} onClose={()=>setShowAccuse(false)} player={player}/>}
      {showReverse&&<ReverseModal caseData={caseData} player={player} state={revState} setState={setRevState} onClose={()=>setShowReverse(false)} diff={diff} settings={settings}/>}
      {showDossier&&<DossierModal suspect={showDossier} dynamicAlibis={dynamicAlibis} onClose={()=>setShowDossier(null)}/>}
      {showTimeline&&<TimelineModal suspect={showTimeline} onClose={()=>setShowTimeline(null)}/>}
      {showMap&&<SceneMapModal caseData={caseData} activeRoom={activeRoom} setActiveRoom={setActiveRoom} clues={clues} onClose={()=>setShowMap(false)}/>}
      {showCCTV&&<CCTVReplay caseData={caseData} onClose={()=>setShowCCTV(false)}/>}
      {showPolaroids&&<PolaroidWall caseData={caseData} foundClues={foundClues} onClose={()=>setShowPolaroids(false)}/>}
    </div>
  );
}

// ============================================================
// APP ROOT
// ============================================================
export default function App(){
  const [showSplash,setShowSplash]=useState(true);
  const [screen,setScreen]=useState("home");
  const [gameState,setGameState]=useState(null);
  const [settings,setSettings]=useState({
    claudeModel:"claude-sonnet-4-6",
    elevenLabsKey:"",elevenLabsVoiceId:"",
    aiHints:true,lieDetector:true,narratorEnabled:true,psychProfiler:true,
    autoNotes:true,voiceEnabled:false,newsTicker:true,pressureEvents:true,
  });
  const handleEnd=useCallback((dest)=>{setGameState(null);setScreen(dest||"home");},[]);
  const startGame=(gs)=>{setGameState(gs);setScreen("game");};
  if(showSplash)return(<><style>{css}</style><SplashScreen onDone={()=>setShowSplash(false)}/></>);
  return(
    <>
      <style>{css}</style>
      {screen!=="game"&&(
        <div className="top-nav">
          <span className="display" style={{fontSize:22,color:"#EDE9E0",cursor:"pointer"}} onClick={()=>setScreen("home")}>CASE<span style={{color:"#22D4B4"}}>ZERO</span></span>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span className="tag tag-teal" style={{fontSize:8}}>V3 · CLAUDE AI</span>
            <button className="btn btn-ghost btn-sm" onClick={()=>setScreen("settings")}>⚙</button>
          </div>
        </div>
      )}
      {screen==="home"&&<LandingScreen onStart={s=>setScreen(s)}/>}
      {screen==="settings"&&<SettingsScreen settings={settings} onChange={setSettings} onBack={()=>setScreen("home")}/>}
      {screen==="lobby"&&<LobbyScreen settings={settings} onStart={startGame} onBack={()=>setScreen("home")}/>}
      {screen==="game"&&gameState&&<GameScreen gameState={gameState} settings={settings} onEnd={handleEnd}/>}
    </>
  );
}
ENDOFFILE
echo "Done — $(wc -l < /mnt/user-data/outputs/casezero-v3.jsx) lines"
Output

Command argument is 177_094 bytes, exceeding the 100_000-byte per-argument limit. For large content, pipe via stdin or use a file-write API instead of embedding the content inline in the command. Argument preview: 'cat > /mnt/user-data/outputs/casezero-v3.jsx << \'ENDOFFILE\'\nimport React, { useState, useEffect, useRef, useCallback } from "react";\n\n// ============================================================\n//'
