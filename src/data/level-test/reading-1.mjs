// Level test v2: reading A1–B1. Server-only (answer keys).
// Each passage: { level, title, text, questions: [[stem, [correct, d, d, d]]] }.
// Questions mix main idea, detail, inference, reference and word-in-context.
export default [
  // ---------- A1 (about 80 words) ----------
  {
    level: 'A1', title: 'A message from Deniz',
    text: 'Hi Sam, I’m in Antalya with my friend Elif. Our hotel is small but very clean, and it is near the beach. The weather is hot and sunny every day. In the morning we swim in the sea, and in the afternoon we sleep because it is too hot. In the evening we eat fish at a restaurant in the old town. We come home on Sunday. See you next week! Deniz',
    questions: [
      ['Where is Deniz?', ['On holiday by the sea', 'At home with Sam', 'At work in an old town', 'In a hotel in the mountains']],
      ['What does Deniz do in the afternoon?', ['She sleeps', 'She swims', 'She eats fish', 'She goes to the old town']],
      ['What is true about the hotel?', ['It is clean', 'It is big', 'It is far from the beach', 'It has a restaurant']],
      ['When does Deniz go home?', ['On Sunday', 'Next week', 'Tomorrow', 'In the evening']],
    ],
  },
  {
    level: 'A1', title: 'The new library',
    text: 'The new city library opens next Monday. It is on Park Street, next to the post office. The library is open from 9 a.m. to 8 p.m. from Monday to Saturday. It is closed on Sundays. You can borrow books, watch films and use the computers for free. Children can come to a story hour every Saturday at 11 a.m. To get a library card, bring a photo and your ID card.',
    questions: [
      ['When can you NOT go to the library?', ['On Sunday', 'On Saturday morning', 'On Monday evening at 7', 'On Friday at 9 a.m.']],
      ['What do you need for a library card?', ['A photo and an ID card', 'Some money', 'A book', 'A letter from the post office']],
      ['What is the story hour for?', ['Children', 'Students', 'Old people', 'Teachers']],
      ['How much does it cost to use the computers?', ['Nothing', 'A little money', 'It depends on the day', 'The text does not say']],
    ],
  },
  {
    level: 'A1', title: 'My neighbour',
    text: 'My neighbour is called Mr Aydın. He is seventy years old and he lives alone with his cat, Pamuk. Every morning he walks to the bakery and buys fresh bread. He always buys one more for me. In the afternoon he reads the newspaper in the park. He was a music teacher, and sometimes he plays the piano in the evening. I like the music. On Fridays I help him with his shopping.',
    questions: [
      ['Who lives with Mr Aydın?', ['A cat', 'His wife', 'His son', 'Nobody and no animal']],
      ['Why does he buy two loaves of bread?', ['One is for the writer', 'He is very hungry', 'One is for the cat', 'His family visits every day']],
      ['What was his job?', ['Teacher', 'Baker', 'Musician in a band', 'Journalist']],
      ['How does the writer feel about the piano music?', ['He or she likes it', 'It is too loud', 'It is boring', 'The text does not say']],
    ],
  },
  {
    level: 'A1', title: 'Sign at the swimming pool',
    text: 'Welcome to the City Swimming Pool! Please read our rules. Take a shower before you swim. Wear a swimming cap. Do not run near the pool, because the floor is wet. Do not eat or drink in the pool area; you can use the café. Children under eight must swim with an adult. The pool is open every day from 7 a.m. to 10 p.m. Lessons for adults are on Tuesday and Thursday evenings.',
    questions: [
      ['Why can’t you run near the pool?', ['The floor is wet', 'It is too small', 'Children are swimming', 'It is late']],
      ['Where can you eat?', ['In the café', 'Near the pool', 'In the shower', 'Nowhere']],
      ['A seven-year-old girl wants to swim. What does she need?', ['An adult with her', 'A lesson', 'A ticket from the café', 'Nothing special']],
      ['When are the adult lessons?', ['Tuesday and Thursday evenings', 'Every day', 'Tuesday and Thursday mornings', 'At 7 a.m.']],
    ],
  },

  // ---------- A2 (about 120 words) ----------
  {
    level: 'A2', title: 'A job advert',
    text: 'Café Bosphorus is looking for a part-time waiter or waitress for weekends. You will take orders, serve food and drinks, and help to keep the café clean. You don’t need experience because we will train you, but you must be friendly and good with people. Some English is useful because many of our customers are tourists. The hours are Saturday and Sunday, 10 a.m. to 6 p.m. We pay every week, and you can have a free lunch on the days you work. If you are interested, please send an email with a short description of yourself to our manager, Selin, before 15 June.',
    questions: [
      ['Who is this job good for?', ['Someone who wants to work only at weekends', 'An experienced chef', 'A student who can work every evening', 'Someone who wants a full-time job']],
      ['Why is English useful for this job?', ['Many customers are tourists', 'The manager is English', 'The training is in English', 'The menu is only in English']],
      ['What do workers get every day they work?', ['A meal', 'Extra money', 'A free coffee to take home', 'A day off']],
      ['What should people send to apply?', ['An email about themselves', 'A photo', 'A letter from their teacher', 'Their bank details']],
    ],
  },
  {
    level: 'A2', title: 'Learning to cook',
    text: 'When I moved to a new city for university, I couldn’t cook at all. For the first two months I ate sandwiches and fast food, and I felt tired all the time. Then my flatmate, Burak, offered to teach me. He started with simple things like pasta and omelettes. Every Sunday we cooked a big meal together and invited friends. I made a lot of mistakes. Once I burned the rice so badly that we had to open all the windows! But slowly I got better. Now I cook almost every day, I spend less money, and I feel much healthier. My mother can’t believe it.',
    questions: [
      ['How did the writer feel in the first two months?', ['Tired', 'Happy', 'Healthy', 'Lonely']],
      ['What did the writer and Burak do on Sundays?', ['They cooked for friends', 'They went to restaurants', 'They studied together', 'They visited the writer’s mother']],
      ['Why did they open the windows?', ['Because of the burned rice', 'Because it was hot', 'Because the guests smoked', 'Because the oven was broken']],
      ['What does “My mother can’t believe it” suggest?', ['The change surprises her', 'She doesn’t like the writer’s food', 'She thinks Burak is lying', 'She wants to learn to cook too']],
    ],
  },
  {
    level: 'A2', title: 'Train tickets',
    text: 'You can buy train tickets at the station or online. Online tickets are usually cheaper, especially if you buy them early. Students and people over 65 can get 20% off with a discount card. If you buy a return ticket, you save another 10%. Please remember that you must show your ID with your ticket. If you miss your train, your ticket is not valid on the next one, but you can change the time of your trip for a small fee until one hour before the train leaves. Children under six travel free but don’t get their own seat.',
    questions: [
      ['How can you usually get the cheapest ticket?', ['Buy it online early', 'Buy it at the station', 'Buy it on the train', 'Buy a child ticket']],
      ['What happens if you miss your train?', ['You need a new ticket', 'You can take the next train', 'You get your money back', 'You pay nothing extra']],
      ['A woman of 70 buys a return ticket with a discount card. What does she get?', ['Two discounts', 'A free seat', 'Only the 20% discount', 'No discount']],
      ['What does the word “valid” mean in this text?', ['Acceptable for travel', 'Expensive', 'Changed', 'Lost']],
    ],
  },
  {
    level: 'A2', title: 'A new hobby',
    text: 'Last year my doctor told me to do more exercise, but I hate gyms. They are noisy and expensive, and I never know how to use the machines. Then a friend invited me to join her walking group. Every Saturday about fifteen people meet at the entrance of the forest at 8 a.m. and walk for three hours. Most of them are older than me, but they walk very fast! At first I was always at the back of the group. After a few months I could keep up, and now I sometimes lead the walk. I have lost five kilos and I have made some great new friends.',
    questions: [
      ['Why doesn’t the writer like gyms?', ['They are noisy and expensive', 'They are far away', 'The people are unfriendly', 'They open too late']],
      ['What was difficult at the beginning?', ['Walking as fast as the others', 'Getting up early', 'Finding the forest', 'Talking to older people']],
      ['What does “keep up” mean here?', ['Walk at the same speed as the others', 'Stay awake', 'Carry a heavy bag', 'Continue for many years']],
      ['What is NOT mentioned as a result of the walks?', ['Sleeping better', 'Losing weight', 'New friends', 'Sometimes leading the group']],
    ],
  },

  // ---------- B1 (about 170 words) ----------
  {
    level: 'B1', title: 'Working from home',
    text: 'Since 2020, millions of office workers have discovered what it is like to work from home. For many, the benefits are obvious: no long journey to work, more time with family and the freedom to organise the day. A survey of 2,000 employees found that 70% would like to continue working from home at least two days a week. However, not everyone is enthusiastic. Younger workers in particular say they miss learning from colleagues, and some find it hard to switch off when their office is also their living room. Managers worry about team spirit and about how to support new staff. As a result, many companies are now choosing a “hybrid” model, in which employees spend part of the week in the office and part at home. Experts say the key is to agree clear rules, for example which days the whole team meets, so that people can enjoy the flexibility without feeling isolated.',
    questions: [
      ['What is the main idea of the text?', ['Working from home has advantages and disadvantages', 'Everyone prefers working from home', 'Offices will soon disappear', 'Young people work harder at home']],
      ['According to the survey, most employees…', ['want to work at home on some days', 'want to return to the office full-time', 'never want to see their colleagues again', 'work longer hours at home']],
      ['Why are some young workers less happy at home?', ['They miss learning from colleagues', 'Their homes are too small', 'They have to travel more', 'They earn less money']],
      ['What does “switch off” mean in the text?', ['Stop thinking about work', 'Turn off the computer', 'Change jobs', 'Go to sleep early']],
    ],
  },
  {
    level: 'B1', title: 'The museum that came back',
    text: 'For twenty years the old textile factory on the edge of Bursa stood empty. Its windows were broken, and local people saw it as a dangerous place where children should not play. Then, in 2015, a group of former workers had an idea: why not turn it into a museum about the city’s silk industry? They collected old machines, photographs and stories from their families. At first the city council was not interested, but the group did not give up. They organised open days, and thousands of people came. Eventually the council agreed to pay for the building to be repaired. Today the museum welcomes 80,000 visitors a year, and its café and workshops have created thirty jobs. Visitors can even try weaving silk themselves. “We didn’t just want to remember the past,” says one of the founders, “we wanted to give the building a future.”',
    questions: [
      ['Who started the project?', ['People who used to work in the factory', 'The city council', 'A group of tourists', 'Local children']],
      ['How did the group change the council’s mind?', ['They showed that many people were interested', 'They paid for the repairs themselves', 'They found a rich sponsor', 'They wrote to the newspapers']],
      ['What can visitors do at the museum?', ['Try weaving silk', 'Buy machines', 'Work in the café for free', 'Stay overnight']],
      ['What does the founder mean by the last sentence?', ['The building should be useful today, not only a memory', 'The past is not important', 'The museum will close soon', 'They want to build a new factory']],
    ],
  },
  {
    level: 'B1', title: 'Should children have phones?',
    text: 'At what age should children get their first smartphone? This question causes arguments in many families. Some parents give their children a phone at the age of eight or nine, mainly for safety: they want to be able to contact them when they travel to school alone. Others prefer to wait until secondary school or later. They worry that phones take time away from homework, sport and sleep, and that children may see things online that are not suitable for them. Research does not give a simple answer. One study found that it was not the age of the child that mattered most, but how the phone was used. Children who had clear rules, such as no phones at the dinner table or in the bedroom at night, slept better and did better at school than those without rules. So perhaps the real question is not “when?” but “how?”.',
    questions: [
      ['Why do some parents give young children phones?', ['To keep in touch with them', 'To help them with homework', 'Because phones are cheap', 'So they can play games']],
      ['What did the study find most important?', ['The rules for using the phone', 'The age of the child', 'The price of the phone', 'The number of hours at school']],
      ['Which is an example of a rule mentioned in the text?', ['No phone in the bedroom at night', 'No phone before the age of twelve', 'Only one hour of games a day', 'Parents must check all messages']],
      ['What is the writer’s conclusion?', ['How phones are used matters more than when children get them', 'Children should never have phones', 'Phones always help children at school', 'Parents should follow research exactly']],
    ],
  },
  {
    level: 'B1', title: 'An email of complaint',
    text: 'Dear Sir or Madam, I am writing to complain about the washing machine I bought from your online shop on 3 March. It was delivered a week later than promised, and when it finally arrived, the door was damaged. I called your customer service line the same day. The person I spoke to was polite and promised that a technician would visit within three days. Nobody came. I have called four more times since then, and each time I have been told to wait. It is now almost a month since I paid, and I still cannot use the machine. I would like you to either replace it with a new one this week or give me a full refund. I have attached photos of the damage and a copy of my receipt. I look forward to hearing from you. Yours faithfully, Leyla Kaya',
    questions: [
      ['What was the first problem?', ['The delivery was late', 'The machine was the wrong model', 'The price was wrong', 'The receipt was missing']],
      ['How does Leyla describe the first phone call?', ['The person was polite', 'The person was rude', 'Nobody answered', 'It was very expensive']],
      ['What does Leyla want now?', ['A new machine or her money back', 'A technician next month', 'A discount on her next order', 'An apology letter']],
      ['What has Leyla sent with the email?', ['Photos and a receipt', 'The broken door', 'A copy of her ID', 'Her bank details']],
    ],
  },
];
