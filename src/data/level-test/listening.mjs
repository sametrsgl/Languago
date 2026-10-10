// Level test v2: listening. Server-only (answer keys and scripts).
// Each clip: { level, title, kind, speakers: { A: 'gb-f', ... }, lines: [[speaker, text]], questions }.
// Speaker codes are accent-gender (gb, us, au; f, m); scripts/tts-level-test.mjs
// maps them to Google voices and writes public/audio/level-test/<id>.mp3.
// Learners hear each clip at most twice; questions never depend on the script text.
export default [
  // ---------- A1 ----------
  {
    level: 'A1', title: 'At the café', kind: 'dialogue', speakers: { A: 'gb-f', B: 'gb-m' },
    lines: [
      ['A', 'Hello. Can I help you?'],
      ['B', 'Yes, please. Can I have a tea and a cheese sandwich?'],
      ['A', 'Of course. Milk in your tea?'],
      ['B', 'No, thank you. Just a little sugar.'],
      ['A', 'That’s six pounds fifty, please.'],
      ['B', 'Here you are.'],
    ],
    questions: [
      ['What does the man order?', ['Tea and a cheese sandwich', 'Coffee and a cheese sandwich', 'Tea and a cake', 'Tea with milk and a sandwich']],
      ['How does he like his tea?', ['With a little sugar', 'With milk', 'With milk and sugar', 'With lemon']],
      ['How much does he pay?', ['£6.50', '£5.60', '£6.15', '£16.50']],
    ],
  },
  {
    level: 'A1', title: 'A phone message', kind: 'monologue', speakers: { A: 'us-f' },
    lines: [
      ['A', 'Hi Tom, it’s Maria. I’m sorry, I can’t come to dinner tonight. My daughter is sick and I need to stay at home with her. Can we meet on Thursday? I’m free after six o’clock. Call me back, OK? Bye!'],
    ],
    questions: [
      ['Why can’t Maria come tonight?', ['Her daughter is ill', 'She is working late', 'She is sick', 'Her car is broken']],
      ['When does she want to meet?', ['On Thursday', 'Tonight', 'On Tuesday', 'At the weekend']],
      ['What does she ask Tom to do?', ['Call her', 'Cook dinner', 'Visit her daughter', 'Send a message']],
    ],
  },
  {
    level: 'A1', title: 'Directions', kind: 'dialogue', speakers: { A: 'us-m', B: 'gb-f' },
    lines: [
      ['A', 'Excuse me, where is the train station?'],
      ['B', 'Go straight on and turn left at the bank. The station is on your right, opposite the park.'],
      ['A', 'Is it far?'],
      ['B', 'No, it’s about five minutes on foot.'],
      ['A', 'Great, thank you!'],
    ],
    questions: [
      ['Where does the man want to go?', ['The train station', 'The bank', 'The park', 'The bus station']],
      ['Where should he turn left?', ['At the bank', 'At the park', 'At the station', 'At the traffic lights']],
      ['How long does it take to walk there?', ['About five minutes', 'About fifteen minutes', 'About fifty minutes', 'About one minute']],
    ],
  },

  // ---------- A2 ----------
  {
    level: 'A2', title: 'Booking a hotel room', kind: 'dialogue', speakers: { A: 'gb-m', B: 'us-f' },
    lines: [
      ['A', 'Good afternoon, Seaview Hotel.'],
      ['B', 'Hello. I’d like to book a double room for two nights, from the twelfth of August.'],
      ['A', 'Let me check. Yes, we have a double room with a sea view for ninety-five pounds a night, or one at the back for seventy-five.'],
      ['B', 'Hmm, I’ll take the cheaper one. Is breakfast included?'],
      ['A', 'Breakfast is ten pounds extra per person. And parking is free.'],
      ['B', 'OK, no breakfast then. We’ll find a café.'],
    ],
    questions: [
      ['How many nights does the woman want to stay?', ['Two', 'Three', 'Twelve', 'One']],
      ['Which room does she choose?', ['The room at the back', 'The room with a sea view', 'A single room', 'She doesn’t book a room']],
      ['What does she decide about breakfast?', ['She won’t have it at the hotel', 'She will pay for it', 'It is free with the room', 'She will have it in her room']],
    ],
  },
  {
    level: 'A2', title: 'Airport announcement', kind: 'announcement', speakers: { A: 'gb-f' },
    lines: [
      ['A', 'Good morning. This is an announcement for passengers on flight TK 1984 to Istanbul. Because of bad weather, this flight is delayed by about forty minutes. The new departure time is ten fifteen. Boarding will now take place at gate twenty-two, not gate twelve. Passengers with small children may board first. We are sorry for the delay.'],
    ],
    questions: [
      ['Why is the flight delayed?', ['The weather is bad', 'There is a technical problem', 'The crew is late', 'The gate is closed']],
      ['What is the new departure time?', ['10:15', '10:40', '9:35', '10:50']],
      ['What has changed besides the time?', ['The gate', 'The destination', 'The flight number', 'The airline']],
    ],
  },
  {
    level: 'A2', title: 'Weekend plans', kind: 'dialogue', speakers: { A: 'us-m', B: 'us-f' },
    lines: [
      ['A', 'Are you doing anything this weekend?'],
      ['B', 'On Saturday I’m helping my sister. She’s moving to a new apartment. But Sunday is free. Why?'],
      ['A', 'There’s a food festival in the park on Sunday. I thought we could go together.'],
      ['B', 'Sounds fun! What time?'],
      ['A', 'It starts at eleven, but let’s go at twelve. It’s less crowded at lunchtime, believe it or not.'],
      ['B', 'Perfect. I’ll meet you at the main gate.'],
    ],
    questions: [
      ['What is the woman doing on Saturday?', ['Helping her sister move', 'Going to a festival', 'Working', 'Visiting a new apartment to buy']],
      ['When will they go to the festival?', ['At twelve on Sunday', 'At eleven on Sunday', 'At twelve on Saturday', 'At eleven on Saturday']],
      ['Where will they meet?', ['At the main gate', 'At her sister’s apartment', 'At a restaurant', 'At the bus stop']],
    ],
  },

  // ---------- B1 ----------
  {
    level: 'B1', title: 'A voicemail from the dentist', kind: 'monologue', speakers: { A: 'gb-f' },
    lines: [
      ['A', 'Hello, this is a message for Mr Kaplan from Bridge Street Dental Practice. I’m afraid Dr Evans is unwell and won’t be able to see you for your appointment tomorrow at nine thirty. We can offer you the same time on Friday, or an afternoon appointment next Monday with a different dentist, Dr Shah. If neither of those is convenient, please give us a call and we’ll find something else. Our phone lines are open from eight until five thirty. Thank you, and sorry for any inconvenience.'],
    ],
    questions: [
      ['Why is the dentist calling?', ['To cancel tomorrow’s appointment', 'To confirm an appointment', 'To ask for payment', 'To change the address of the practice']],
      ['What is offered for Friday?', ['An appointment at 9:30', 'An afternoon appointment with Dr Shah', 'A phone consultation', 'An appointment with Dr Evans at 5:30']],
      ['What should Mr Kaplan do if neither option suits him?', ['Phone the practice', 'Go to the practice on Monday', 'Send an email', 'Wait for another message']],
    ],
  },
  {
    level: 'B1', title: 'Choosing a course', kind: 'dialogue', speakers: { A: 'gb-m', B: 'gb-f' },
    lines: [
      ['A', 'So, have you decided which evening class to do?'],
      ['B', 'Not yet. I was going to do photography, but it’s on Tuesdays, and that’s when I play volleyball.'],
      ['A', 'What about the Spanish course? You’ve always said you wanted to learn a language.'],
      ['B', 'I know, but it’s twice a week, and honestly, with my job I don’t think I’d keep up with the homework.'],
      ['A', 'There’s a cookery course on Thursdays. Just one evening, no homework, and you eat what you make.'],
      ['B', 'Now that’s more like it. I’ll sign up tomorrow.'],
    ],
    questions: [
      ['Why doesn’t the woman choose photography?', ['It clashes with her volleyball', 'It is too expensive', 'She isn’t interested', 'It has too much homework']],
      ['What is her concern about the Spanish course?', ['She wouldn’t have time for the work', 'The teacher isn’t good', 'It’s too easy for her', 'It’s only on Thursdays']],
      ['What does “Now that’s more like it” show?', ['She likes the cookery idea', 'She doesn’t like cooking', 'She has already signed up', 'She prefers photography after all']],
    ],
  },
  {
    level: 'B1', title: 'Radio: local news', kind: 'monologue', speakers: { A: 'us-m' },
    lines: [
      ['A', 'And now the local news. The city council has announced that the central library will close for six months from the first of March for major repairs to the roof. During that time, a temporary library will open in the old post office building on King Street, although with a smaller selection of books. Online services, including e-books and audiobooks, will not be affected. The council says the repairs are overdue and that, when the library reopens, it will have a new café and a study area for students.'],
    ],
    questions: [
      ['Why is the library closing?', ['To repair the roof', 'Because of low visitor numbers', 'To build a new post office', 'Because of a lack of money']],
      ['What will be different at the temporary library?', ['There will be fewer books', 'There will be no staff', 'It will only offer e-books', 'It will open only at weekends']],
      ['What will the library have when it reopens?', ['A café and a study area', 'A bigger children’s section', 'A cinema', 'Longer opening hours']],
    ],
  },

  // ---------- B2 ----------
  {
    level: 'B2', title: 'A podcast about sleep', kind: 'dialogue', speakers: { A: 'gb-f', B: 'us-m' },
    lines: [
      ['A', 'So, Dr Miller, people often say teenagers are just lazy because they sleep late. Is that fair?'],
      ['B', 'Not really. During adolescence, the body clock actually shifts. Teenagers start producing the sleep hormone melatonin later in the evening, so they genuinely aren’t tired at ten o’clock. Then we expect them to be alert at eight in the morning, which, biologically, is like asking an adult to start work at five.'],
      ['A', 'So should schools start later?'],
      ['B', 'The evidence suggests it helps. Schools that moved their start time even by forty-five minutes saw better attendance and, interestingly, fewer car accidents involving young drivers. But it’s not a magic solution. If the extra time just means more hours on a phone at night, the benefits disappear.'],
    ],
    questions: [
      ['What is Dr Miller’s view of the idea that teenagers are lazy?', ['It is unfair because their body clock changes', 'It is completely correct', 'It is true only for older teenagers', 'It depends on the school']],
      ['What does he compare an 8 a.m. start to?', ['An adult starting work at five', 'An adult working all night', 'A child staying up late', 'A long journey to school']],
      ['What warning does he give about later start times?', ['They don’t help if students use the time on phones', 'They cause more car accidents', 'They reduce attendance', 'They are too expensive for schools']],
    ],
  },
  {
    level: 'B2', title: 'A work meeting', kind: 'dialogue', speakers: { A: 'us-f', B: 'gb-m', C: 'au-f' },
    lines: [
      ['A', 'OK, let’s look at the launch date. Marketing wants the app out by the fifteenth.'],
      ['B', 'Honestly, I don’t see how that’s realistic. We found three serious bugs in testing last week, and one of them affects payments.'],
      ['C', 'Could we launch without the payment feature and add it in an update?'],
      ['B', 'Technically yes, but then the free version would be the only thing people see, and first impressions matter.'],
      ['A', 'Right. I’d rather go two weeks late than launch something that looks unfinished. I’ll speak to marketing this afternoon and propose the first of next month.'],
      ['C', 'Fine by me, as long as we keep them updated weekly.'],
    ],
    questions: [
      ['What is the man’s main concern?', ['There are serious unsolved problems in the app', 'Marketing has no budget', 'The app is too expensive', 'The team is too small']],
      ['What alternative does one of the women suggest?', ['Launching without payments at first', 'Cancelling the launch', 'Hiring more testers', 'Launching earlier than planned']],
      ['What does the manager decide?', ['To propose a later launch date', 'To launch on the fifteenth anyway', 'To remove the payment feature for ever', 'To let marketing decide']],
    ],
  },
  {
    level: 'B2', title: 'Museum audio guide', kind: 'monologue', speakers: { A: 'gb-m' },
    lines: [
      ['A', 'You are now standing in front of one of the museum’s most unusual objects: a mechanical clock made in the late sixteenth century as a gift for the Ottoman sultan. At the time, European rulers often sent clocks to Istanbul, partly to impress the court with their craftsmanship. This one, however, was damaged on the long journey and had to be repaired by local craftsmen, who replaced several of the original parts and added the Ottoman numerals you can see on the face. So in a sense, the clock you see today is the work of two cultures rather than one. Notice also the small figures at the top, which once moved every hour. They have not worked for over two hundred years.'],
    ],
    questions: [
      ['Why did European rulers send clocks to Istanbul?', ['Partly to show off their skill', 'To pay their debts', 'Because the Ottomans could not make clocks', 'As payment for trade agreements']],
      ['What happened to this clock?', ['It was damaged and repaired locally', 'It was lost on the journey', 'It was sent back to Europe', 'It was never used']],
      ['Why does the guide call it “the work of two cultures”?', ['It contains both European and Ottoman work', 'It was made by two European countries', 'It shows two different times', 'It was given to two sultans']],
    ],
  },

  // ---------- C1 ----------
  {
    level: 'C1', title: 'Lecture: the history of tea', kind: 'monologue', speakers: { A: 'gb-f' },
    lines: [
      ['A', 'Now, it’s tempting to think of tea in Turkey as an ancient tradition, but in fact it’s relatively recent. For most of the Ottoman period, coffee was the drink of social life. Tea only really took hold in the twentieth century, and the reasons were as much economic as cultural. After the First World War, coffee, which had to be imported, became expensive, whereas tea could be grown at home. The government actively encouraged tea production along the eastern Black Sea coast, around Rize, from the nineteen-thirties onwards, and by the nineteen-sixties tea had become cheaper and more widely available than coffee. So what we now regard as a timeless national habit is, to a large extent, the product of deliberate policy. That’s not to say it’s any less authentic, of course. Traditions are always invented at some point; what matters is that people embraced it.'],
    ],
    questions: [
      ['What is the speaker’s main point about tea in Turkey?', ['It became popular relatively recently, partly for economic reasons', 'It has been the national drink for centuries', 'It replaced coffee because of health concerns', 'It was first introduced by Ottoman sultans']],
      ['Why did coffee become less common after the First World War?', ['It became expensive to import', 'It was banned by the government', 'People preferred the taste of tea', 'Coffee shops were closed']],
      ['How does the speaker view the “invented” nature of the tradition?', ['It doesn’t make the tradition less genuine', 'It makes the tradition less authentic', 'It should be taught in schools', 'It is a reason to drink more coffee']],
    ],
  },
  {
    level: 'C1', title: 'Interview with an architect', kind: 'dialogue', speakers: { A: 'us-m', B: 'au-f' },
    lines: [
      ['A', 'Your recent projects use a lot of reclaimed materials. Is that mainly about sustainability?'],
      ['B', 'Partly, but I’d be lying if I said it was purely an environmental decision. Reclaimed brick and timber have a character you simply can’t manufacture. They carry the marks of their previous lives, and clients respond to that, often quite emotionally.'],
      ['A', 'Isn’t it more expensive, though?'],
      ['B', 'It can be, and that’s the part people underestimate. The materials themselves are sometimes cheap, but sourcing them, cleaning them and checking they’re structurally sound takes time, and time is money. Where it pays off is over the life of the building. You’ve avoided the carbon cost of new materials, and well-made old timber, frankly, often outlasts what’s produced today.'],
    ],
    questions: [
      ['Why does the architect use reclaimed materials, according to her?', ['For environmental reasons and for their character', 'Only because they are cheaper', 'Because clients insist on it', 'Because new materials are hard to find']],
      ['What do people tend to underestimate about reclaimed materials?', ['The time and work needed to prepare them', 'How strong they are', 'How attractive they look', 'How easy they are to find']],
      ['What benefit does she mention “over the life of the building”?', ['Lower carbon cost and long-lasting materials', 'Lower prices for buyers', 'Faster construction', 'Easier repairs']],
    ],
  },
  {
    level: 'C1', title: 'A complaint about a tour', kind: 'dialogue', speakers: { A: 'gb-m', B: 'us-f' },
    lines: [
      ['A', 'I understand you weren’t happy with the Cappadocia tour. Could you tell me what went wrong?'],
      ['B', 'Well, the balloon flight was cancelled because of the wind, which, fine, nobody can control the weather. What I object to is that we were told at six in the morning, after we’d already been driven out to the launch site, and then offered nothing in its place. The brochure clearly says that if the flight is cancelled, you’ll be rebooked for the following day.'],
      ['A', 'I see. In fairness, the next day was fully booked because of the earlier cancellations.'],
      ['B', 'Then you shouldn’t promise what you can’t deliver. I’m not asking for compensation for the weather. I’m asking for the refund the brochure promises, and frankly an apology for the way it was handled.'],
    ],
    questions: [
      ['What is the woman’s main objection?', ['How the cancellation was handled and the broken promise', 'That the balloon flight was cancelled at all', 'The price of the tour', 'The behaviour of the pilot']],
      ['How does the man try to defend the company?', ['By explaining that the next day was full', 'By blaming the weather company', 'By offering a free flight', 'By saying the brochure was out of date']],
      ['What does the woman want?', ['A refund and an apology', 'A flight the next day', 'Compensation for the weather', 'A different tour']],
    ],
  },

  // ---------- C2 ----------
  {
    level: 'C2', title: 'Panel discussion: expertise', kind: 'dialogue', speakers: { A: 'gb-f', B: 'us-m' },
    lines: [
      ['A', 'There’s a lot of talk about a crisis of trust in experts. Do you think it’s overstated?'],
      ['B', 'Somewhat. Surveys still show high trust in, say, doctors and scientists in general. What’s eroded is trust in experts when they speak on contested political questions. And to be blunt, some of that scepticism has been earned. Economists were remarkably confident before 2008, and that confidence turned out to be misplaced.'],
      ['A', 'But isn’t there a danger of throwing the baby out with the bathwater?'],
      ['B', 'Absolutely. The answer to fallible expertise isn’t no expertise; it’s expertise that’s more candid about uncertainty. Ironically, experts often feel pressured to sound more certain than they are, precisely because they fear that admitting doubt will be exploited. That defensiveness is, in the long run, what does the most damage.'],
    ],
    questions: [
      ['According to the man, where has trust in experts declined most?', ['On disputed political issues', 'In medicine', 'In science generally', 'In education']],
      ['Why does he mention economists before 2008?', ['As an example of scepticism that was deserved', 'To show that experts are always wrong', 'To praise their predictions', 'To argue that the crisis was unpredictable']],
      ['What does he see as most damaging in the long run?', ['Experts hiding their uncertainty out of fear', 'The public ignoring experts', 'Surveys about trust', 'Politicians criticising scientists']],
    ],
  },
  {
    level: 'C2', title: 'Radio essay: on walking', kind: 'monologue', speakers: { A: 'gb-m' },
    lines: [
      ['A', 'There is a peculiar kind of thinking that only seems to happen on foot. Philosophers from Rousseau to Nietzsche claimed to do their best work while walking, and it would be easy to dismiss this as a romantic affectation, the sort of thing people say about their habits to make them sound profound. Yet the claim has some support. The rhythm of walking appears to loosen the grip of focused attention just enough to let ideas drift and collide, without tipping into the passivity of, say, lying on a sofa. What strikes me, though, is how thoroughly we have organised walking out of daily life. We drive to the gym to walk on a machine, and we fill whatever walks remain with podcasts and phone calls, so that the one activity that reliably gave the mind room to wander has become yet another occasion for input. I don’t propose that we abandon our headphones. I merely wonder what we might think of if, occasionally, we let the silence in.'],
    ],
    questions: [
      ['How does the speaker treat the philosophers’ claims about walking?', ['He thinks they may be more than an affectation', 'He dismisses them as romantic nonsense', 'He says they have been disproved', 'He thinks they apply only to philosophers']],
      ['What is ironic about modern habits, according to him?', ['We fill walks with input, losing their benefit for thinking', 'We walk more than ever but think less', 'Gyms have made walking unnecessary', 'Podcasts have encouraged more walking']],
      ['What is his final suggestion?', ['Sometimes walking without listening to anything', 'Giving up headphones completely', 'Walking instead of going to the gym', 'Reading philosophy while walking']],
    ],
  },
  {
    level: 'C2', title: 'Negotiating a contract', kind: 'dialogue', speakers: { A: 'us-f', B: 'gb-m' },
    lines: [
      ['A', 'I’ll be candid. The price you’ve quoted is about fifteen per cent above what we’d budgeted, and our board won’t sign off on it as it stands.'],
      ['B', 'I appreciate your frankness. I should say our margins on this are already fairly thin. That said, there’s some room for manoeuvre if we look at the structure rather than the headline figure. If you were prepared to commit to a three-year agreement instead of one, we could bring the annual cost down considerably, and we’d be willing to cap any increases at inflation.'],
      ['A', 'That’s an interesting proposal, though a three-year commitment is a big ask given that we haven’t worked together before.'],
      ['B', 'Understood. What if we built in a break clause after the first year, conditional on agreed performance targets? You’d have the lower price and a way out if we don’t deliver.'],
      ['A', 'Now that, I think, I could take to the board.'],
    ],
    questions: [
      ['What is the woman’s initial problem?', ['The price is higher than her company planned to pay', 'The contract is too short', 'The service is of poor quality', 'Her board has already rejected the company']],
      ['How does the man propose to reduce the cost?', ['Through a longer agreement', 'By cutting his margins further', 'By removing some services', 'By delaying payment']],
      ['Why does the break clause make the offer acceptable?', ['It limits the risk of committing to a new supplier', 'It lowers the price even further', 'It allows the board to cancel at any time', 'It guarantees price increases']],
    ],
  },
];
