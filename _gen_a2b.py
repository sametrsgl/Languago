#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Second idempotent pass: reach >=20 per unit. Skips stems already in file."""
import re

PATH = r"C:/Users/Samet Tıraşoğlu.DESKTOP-V1NEC06/synth-app/languago-platform/src/data/grammar_mcq_a2.js"
NEW = {}

def w(q, o, a):  # why helper: build 4 parallel Turkish lines generic-ish (overridden inline below)
    return (q, o, a, None)

NEW["a2-11"] = [
("Last year she ___ in a big company.", ["worked","works","is working","working"], 0,
 ["Correct: 'last year' → geçmiş worked.","Geniş 'works' geçmiş için değil.","Şimdiki 'is working' geçmiş için değil.","'working' tek başına olamaz."]),
]
NEW["a2-12"] = [
("The new phone is ___ the old one.", ["not as good as","more good as","good as","as good than"], 0,
 ["Correct: eşitsizlik → not as + good + as.","'more good as' — as…as'ta more olmaz.","'good as' — ilk 'as' eksik.","'as good than' — as…as'ta than olmaz."]),
("This box is ___ as that box.", ["twice as heavy","more heavy as","heavy as","as heavier as"], 0,
 ["Correct: kıyas → twice as + heavy + as.","'more heavy as' — as…as'ta more olmaz.","'heavy as' — ilk 'as' eksik.","'as heavier as' — as…as arasına -er gelmez."]),
("My bedroom is ___ as the kitchen.", ["nearly as big","more big as","big as","as bigger as"], 0,
 ["Correct: yaklaşık eşitlik → nearly as + big + as.","'more big as' — as…as'ta more olmaz.","'big as' — ilk 'as' eksik.","'as bigger as' — as…as arasına -er gelmez."]),
]
NEW["a2-13"] = [
("It's cold. I ___ close the window.", ["will","is","am","will to"], 0,
 ["Correct: anlık karar gelecek → will.","'is' tek başına yardımcı değil.","'am' 'close' ile uyumsuz (am close olmaz).","'will to' — will sonrası 'to' gelmez."]),
("We ___ be home late tonight.", ["will","are","does","was"], 0,
 ["Correct: gelecek → will + be.","'are be' çift çekim.","'does be' uyumsuz.","'was be' çift çekim."]),
("___ you come to my party? Yes.", ["Will","Are","Do","Is"], 0,
 ["Correct: davet/gelecek sorusu → Will you…?","'Are come' olmaz.","'Do' şimdiki/genel; gelecek davet için değil.","'Is' özne you ile uyumsuz."]),
("I ___ not forget your birthday.", ["will","am","is","do"], 0,
 ["Correct: gelecek söz → will not (won't).","'am not forget' olmaz.","'is' uyumsuz.","'do not forget' şimdi; gelecek sözü değil."]),
("They ___ arrive tomorrow afternoon.", ["will","will to","is","was"], 0,
 ["Correct: gelecek → will + yalın fiil.","'will to arrive' — will sonrası 'to' gelmez.","'is' çoğul+gelecek için değil.","'was' geçmiş; gelecek için değil."]),
("She thinks it ___ be sunny next week.", ["will","is","are","has"], 0,
 ["Correct: tahmin → will + be.","'is be' çift çekim.","'are' tekil it için değil.","'has be' gramer dışı."]),
("I promise I ___ help you tomorrow.", ["will","does","am","are"], 0,
 ["Correct: gelecek söz → will.","'does help' uyumsuz.","'am help' olmaz.","'are help' olmaz."]),
("He ___ call you when he arrives.", ["will","do","does","was"], 0,
 ["Correct: gelecek → will + yalın fiil.","'do' gelecek kurmaz.","'does call' şimdi; gelecek değil.","'was call' çift çekim."]),
("Maybe they ___ come to the concert.", ["will","is","are","was"], 0,
 ["Correct: olasılık/gelecek → will.","'is' çoğul+gelecek için değil.","'are come' olmaz.","'was' geçmiş; olasılık için değil."]),
("We ___ buy a present for mother.", ["will","will to","does","are"], 0,
 ["Correct: gelecek niyet → will.","'will to' — will sonrası 'to' gelmez.","'does' çoğul+gelecek için değil.","'are buy' olmaz."]),
("I think she ___ like this gift.", ["will","is","are","do"], 0,
 ["Correct: tahmin → will.","'is like' şimdiki; tahmin değil.","'are' tekil için değil.","'do like' şimdi; tahmin değil."]),
("___ he finish the report by Friday?", ["Will","Does","Is","Are"], 0,
 ["Correct: gelecek sorusu → Will he…?","'Does finish' alışkanlık; 'by Friday' gelecek.","'Is finish' olmaz.","'Are' he ile kullanılmaz."]),
("Don't worry, everything ___ be fine.", ["will","is","are","was"], 0,
 ["Correct: gelecek güvence → will + be.","'is be' çift çekim.","'are' tekil için değil.","'was' geçmiş; güvence için değil."]),
("Next year I ___ start a new course.", ["will","am","does","will to"], 0,
 ["Correct: gelecek plan → will.","'am' 'start' ile uyumsuz.","'does' I+gelecek için değil.","'will to' — will sonrası 'to' gelmez."]),
("She ___ send you an email tonight.", ["will","is","do","was"], 0,
 ["Correct: gelecek → will + yalın fiil.","'is send' olmaz.","'do send' şimdi; gelecek değil.","'was send' çift çekim."]),
]
NEW["a2-14"] = [
("She ___ her piano lesson at four tomorrow.", ["is having","have","has","having"], 0,
 ["Correct: çizelge/plan → is having.","'have' çekimsiz + plan değil.","'has' planlı gelecek için değil.","'having' tek başına çekimsiz."]),
]
NEW["a2-15"] = [
("You ___ be quiet in the library.", ["must","must to","musts","is must"], 0,
 ["Correct: kural → must.","'must to' — must sonrası 'to' gelmez.","'musts' — must çekimlenmez.","'is must' çift yardımcı."]),
("We ___ buy a bus ticket before the trip.", ["have to","has to","to have","having to"], 0,
 ["Correct: zorunluluk → have to.","'has to' we için değil.","'to have' sıralama yanlış.","'having to' tek başına olamaz."]),
("Do we ___ pay for the entrance?", ["have to","has to","to have","must to"], 0,
 ["Correct: do'dan sonra → have to.","'has to' do desteğiyle uymaz (do+has to olmaz).","'to have' sıralama yanlış.","'must to' — must sonrası 'to' gelmez."]),
("He ___ work hard to save money.", ["has to","have to","to have","haves to"], 0,
 ["Correct: 3. tekil → has to.","'have to' he için değil.","'to have' sıralama yanlış.","'haves to' — has zaten; haves yok."]),
("You ___ park here. It's not allowed.", ["mustn't","don't have to","not must","mustn't to"], 0,
 ["Correct: yasak → mustn't.","'don't have to' gerek yok anlamı; yasak değil.","'not must' kalıp yok.","'mustn't to' — must sonrası 'to' gelmez."]),
("I ___ get up early tomorrow for the flight.", ["have to","has to","to has","having"], 0,
 ["Correct: zorunluluk → have to.","'has to' I için değil.","'to has' sıralama yanlış.","'having' tek başına çekimsiz."]),
("She doesn't ___ cook dinner tonight.", ["have to","has to","to have","having"], 0,
 ["Correct: doesn't'ten sonra → have to.","'has to' do desteğiyle değil.","'to have' burada uymaz.","'having' tek başına olamaz."]),
("They ___ wear a uniform at work.", ["have to","has to","to have","having"], 0,
 ["Correct: zorunluluk → have to.","'has to' çoğul için değil.","'to have' sıralama yanlış.","'having' tek başına çekimsiz."]),
("You ___ tell anyone this secret.", ["mustn't","mustn't to","don't have to","musts"], 0,
 ["Correct: yasak/uyarı → mustn't.","'mustn't to' — must sonrası 'to' gelmez.","'don't have to' gerek yok; yasak değil.","'musts' — must çekimlenmez."]),
("We ___ be at the station by seven.", ["must","must to","musts","is must"], 0,
 ["Correct: güçlü zorunluluk → must.","'must to' — 'to' gelmez.","'musts' — çekim yok.","'is must' çift yardımcı."]),
("Does he ___ clean his room today?", ["have to","has to","to have","must"], 0,
 ["Correct: does'ten sonra → have to.","'has to' do desteğiyle uymaz.","'to have' sıralama yanlış.","'must' do desteğiyle kullanılmaz."]),
("You ___ bring your own towels; the hotel has them.", ["don't have to","mustn't","mustn't to","not have"], 0,
 ["Correct: gerek yok → don't have to.","'mustn't' yasak; burada gereklilik yok.","'mustn't to' — 'to' gelmez.","'not have' çekimsiz."]),
("She ___ finish this project today.", ["has to","have to","to have","haves"], 0,
 ["Correct: 3. tekil → has to.","'have to' she için değil.","'to have' sıralama yanlış.","'haves' yok."]),
("The doctor says I ___ take this medicine.", ["must","must to","musts","is must"], 0,
 ["Correct: güçlü zorunluluk → must.","'must to' — 'to' gelmez.","'musts' — çekim yok.","'is must' çift yardımcı."]),
("You ___ eat in the classroom. It's forbidden.", ["mustn't","don't have to","mustn't to","hasn't to"], 0,
 ["Correct: yasak → mustn't.","'don't have to' gerek yok; yasak değil.","'mustn't to' — 'to' gelmez.","'hasn't to' bu biçimde kullanılmaz."]),
]
NEW["a2-16"] = [
("You ___ wear a coat in winter.", ["should","shoulds","should to","is should"], 0,
 ["Correct: tavsiye → should.","'shoulds' — çekim yok.","'should to' — 'to' gelmez.","'is should' çift yardımcı."]),
("They ___ leave early to catch the bus.", ["should","should to","shoulds","are should"], 0,
 ["Correct: tavsiye → should.","'should to' — 'to' gelmez.","'shoulds' — çekim yok.","'are should' çift yardımcı."]),
("She ___ drink so much coffee.", ["shouldn't","shouldn't to","don't should","shouldn'ts"], 0,
 ["Correct: olumsuz tavsiye → shouldn't.","'shouldn't to' — 'to' gelmez.","'don't should' do ile kullanılmaz.","'shouldn'ts' — çekim yok."]),
("___ we book a table first?", ["Should","Does","Are","Will"], 0,
 ["Correct: tavsiye sorusu → Should we…?","'Does' should ile değil.","'Are' tavsiye sorusu kurmaz.","'Will' gelecek; tavsiye sorusu için değil."]),
("You ___ listen to the teacher.", ["should","should to","shoulds","does should"], 0,
 ["Correct: tavsiye → should.","'should to' — 'to' gelmez.","'shoulds' — çekim yok.","'does should' çift yardımcı."]),
("He ___ be more careful with his phone.", ["should","shoulds","should to","is should"], 0,
 ["Correct: tavsiye → should.","'shoulds' — çekim yok.","'should to' — 'to' gelmez.","'is should' çift yardımcı."]),
("We ___ call them before we go.", ["should","should to","are should","shoulds"], 0,
 ["Correct: tavsiye → should.","'should to' — 'to' gelmez.","'are should' çift yardımcı.","'shoulds' — çekim yok."]),
("She ___ say sorry to her friend.", ["should","shoulds","should to","does should"], 0,
 ["Correct: tavsiye → should.","'shoulds' — çekim yok.","'should to' — 'to' gelmez.","'does should' çift yardımcı."]),
("You ___ stay up so late.", ["shouldn't","shouldn't to","don't should","shouldn'ts"], 0,
 ["Correct: olumsuz tavsiye → shouldn't.","'shouldn't to' — 'to' gelmez.","'don't should' do ile kullanılmaz.","'shouldn'ts' — çekim yok."]),
("I think you ___ see that film.", ["should","should to","shoulds","are should"], 0,
 ["Correct: tavsiye → should.","'should to' — 'to' gelmez.","'shoulds' — çekim yok.","'are should' çift yardımcı."]),
("___ he tell his parents about it?", ["Should","Does","Is","Are"], 0,
 ["Correct: tavsiye sorusu → Should he…?","'Does' tavsiye sorusu kurmaz.","'Is' should ile değil.","'Are' he ile kullanılmaz."]),
("You ___ exercise every day.", ["should","should to","shoulds","is should"], 0,
 ["Correct: tavsiye → should.","'should to' — 'to' gelmez.","'shoulds' — çekim yok.","'is should' çift yardımcı."]),
("We ___ arrive late for the meeting.", ["shouldn't","shouldn't to","don't should","shouldn'ts"], 0,
 ["Correct: olumsuz tavsiye → shouldn't.","'shouldn't to' — 'to' gelmez.","'don't should' do ile kullanılmaz.","'shouldn'ts' — çekim yok."]),
("She ___ save some money every month.", ["should","shoulds","should to","are should"], 0,
 ["Correct: tavsiye → should.","'shoulds' — çekim yok.","'should to' — 'to' gelmez.","'are should' çift yardımcı."]),
("They ___ help with the housework.", ["should","should to","shoulds","does should"], 0,
 ["Correct: tavsiye → should.","'should to' — 'to' gelmez.","'shoulds' — çekim yok.","'does should' çift yardımcı."]),
]
NEW["a2-17"] = [
("When he was young, my father ___ play football well.", ["could","coulds","could to","caned"], 0,
 ["Correct: geçmişte yetenek → could.","'coulds' — çekim yok.","'could to' — 'to' gelmez.","'caned' — can geçmiş yapmaz."]),
("I ___ read when I was four.", ["could","could to","coulds","cans"], 0,
 ["Correct: geçmişte yetenek → could.","'could to' — 'to' gelmez.","'coulds' — çekim yok.","'cans' şimdiki; geçmiş değil."]),
("She asked if I ___ help her.", ["could","could to","coulds","cans"], 0,
 ["Correct: geçmiş rica/kibarlık → could.","'could to' — 'to' gelmez.","'coulds' — çekim yok.","'cans' geçmiş bağlamla uymaz."]),
("___ you speak slower, please?", ["Could","Coulds","Are","Do"], 0,
 ["Correct: kibar rica → Could you…?","'Coulds' — çekim yok.","'Are' rica kurmaz.","'Do' kibar istek için değil."]),
("We ___ not see the stage from our seats.", ["could","could to","coulds","caned"], 0,
 ["Correct: geçmiş olumsuz → could not.","'could to' — 'to' gelmez.","'coulds' — çekim yok.","'caned' yok."]),
("He was so tired he ___ keep his eyes open.", ["couldn't","couldn't to","can't","coulds"], 0,
 ["Correct: geçmiş olumsuz → couldn't.","'couldn't to' — 'to' gelmez.","'can't' şimdiki; geçmiş için değil.","'coulds' — çekim yok."]),
("My sister ___ ride a horse when she was ten.", ["could","coulds","could to","is could"], 0,
 ["Correct: geçmişte yetenek → could.","'coulds' — çekim yok.","'could to' — 'to' gelmez.","'is could' çift yardımcı."]),
("They ___ find the way without a map.", ["couldn't","couldn't to","can't","not could"], 0,
 ["Correct: geçmiş olumsuz → couldn't.","'couldn't to' — 'to' gelmez.","'can't' şimdiki; geçmiş değil.","'not could' sıralama yanlış."]),
("___ I borrow your pen for a moment?", ["Could","Coulds","Am","Does"], 0,
 ["Correct: kibar rica → Could I…?","'Coulds' — çekim yok.","'Am' rica kurmaz.","'Does' özne I+rica için değil."]),
("When we lived there, we ___ see the sea from our window.", ["could","could to","coulds","cans"], 0,
 ["Correct: geçmişte yetenek → could.","'could to' — 'to' gelmez.","'coulds' — çekim yok.","'cans' şimdiki; 'lived' geçmiş."]),
("I wish I ___ come to your party.", ["could","can","coulds","could to"], 0,
 ["Correct: istek/temenni → could.","'can' bu temenni kalıbında olmaz.","'coulds' — çekim yok.","'could to' — 'to' gelmez."]),
("He ___ reach the top shelf easily.", ["could","coulds","could to","is can"], 0,
 ["Correct: geçmişte yetenek → could.","'coulds' — çekim yok.","'could to' — 'to' gelmez.","'is can' çift yardımcı."]),
("___ you carry this box for me?", ["Could","Coulds","Is","Do"], 0,
 ["Correct: kibar rica → Could you…?","'Coulds' — çekim yok.","'Is' rica kurmaz.","'Do' kibar istek için değil."]),
("She ___ speak any English last year.", ["couldn't","couldn't to","can't","not could"], 0,
 ["Correct: geçmiş olumsuz → couldn't.","'couldn't to' — 'to' gelmez.","'can't' şimdiki; 'last year' geçmiş.","'not could' sıralama yanlış."]),
("The students ___ ask questions during the talk.", ["could","coulds","could to","cans"], 0,
 ["Correct: geçmiş izin/yetenek → could.","'coulds' — çekim yok.","'could to' — 'to' gelmez.","'cans' geçmiş bağlamla uymaz."]),
]
NEW["a2-18"] = [
("At 9 o'clock I ___ TV at home.", ["was watching","watched","am watching","watches"], 0,
 ["Correct: geçmişte süren eylem → was watching.","'watched' tek seferlik; süren vurgusu yok.","Şimdiki 'am watching' geçmiş an için değil.","Geniş 'watches' geçmiş için değil."]),
("She ___ her breakfast when the phone rang.", ["was eating","ate","is eating","eats"], 0,
 ["Correct: geçmişte süren eylem → was eating.","'ate' tek seferlik; while sürenliği yok.","Şimdiki 'is eating' geçmiş için değil.","Geniş 'eats' geçmiş bağlamla uymaz."]),
("We ___ when the lights went out.", ["were working","worked","are working","work"], 0,
 ["Correct: çoğul + süren eylem → were working.","'worked' süren vurgusu yok.","Şimdiki 'are working' geçmiş için değil.","Geniş 'work' geçmiş için değil."]),
("I ___ a book at midnight last night.", ["was reading","read","am reading","reads"], 0,
 ["Correct: geçmiş an + süren → was reading.","'read' tek seferlik; süren yok.","Şimdiki 'am reading' geçmiş için değil.","Geniş 'reads' I için değil."]),
("They ___ football when it started to snow.", ["were playing","played","are playing","play"], 0,
 ["Correct: çoğul + süren → were playing.","'played' süren vurgusu yok.","Şimdiki 'are playing' geçmiş için değil.","Geniş 'play' geçmiş için değil."]),
("While we ___ home, we saw an accident.", ["were driving","drove","are driving","drive"], 0,
 ["Correct: while + süren eylem → were driving.","'drove' while ile uyumsuz.","Şimdiki 'are driving' geçmiş için değil.","Geniş 'drive' geçmiş için değil."]),
("He ___ in the garden when his friend arrived.", ["was working","worked","is working","works"], 0,
 ["Correct: geçmişte süren → was working.","'worked' süren vurgusu yok.","Şimdiki 'is working' geçmiş için değil.","Geniş 'works' geçmiş bağlamla uymaz."]),
("The sun ___ when we woke up.", ["was shining","shone","is shining","shines"], 0,
 ["Correct: geçmişte süren → was shining.","'shone' tek seferlik; arka plan yok.","Şimdiki 'is shining' geçmiş için değil.","Geniş 'shines' geçmiş için değil."]),
("I ___ dinner when you called.", ["was cooking","cooked","am cooking","cooks"], 0,
 ["Correct: geçmişte süren → was cooking.","'cooked' tek seferlik; süren yok.","Şimdiki 'am cooking' geçmiş için değil.","Geniş 'cooks' I için değil."]),
("She ___ tennis at 3 pm yesterday.", ["was playing","played","is playing","plays"], 0,
 ["Correct: geçmiş an + süren → was playing.","'played' an vurgusu yok.","Şimdiki 'is playing' geçmiş için değil.","Geniş 'plays' geçmiş için değil."]),
("They ___ in the pool when it began to rain.", ["were swimming","swam","are swimming","swim"], 0,
 ["Correct: çoğul + süren → were swimming.","'swam' süren vurgusu yok.","Şimdiki 'are swimming' geçmiş için değil.","Geniş 'swim' geçmiş için değil."]),
("We ___ to music while we did the dishes.", ["were listening","listened","are listening","listen"], 0,
 ["Correct: while + süren → were listening.","'listened' while ile uyumsuz.","Şimdiki 'are listening' geçmiş için değil.","Geniş 'listen' geçmiş için değil."]),
("He ___ his bike when he fell off.", ["was riding","rode","is riding","rides"], 0,
 ["Correct: geçmişte süren → was riding.","'rode' süren vurgusu yok.","Şimdiki 'is riding' geçmiş için değil.","Geniş 'rides' geçmiş için değil."]),
("The birds ___ when summer came.", ["were singing","sang","are singing","sing"], 0,
 ["Correct: çoğul + süren → were singing.","'sang' süren vurgusu yok.","Şimdiki 'are singing' geçmiş için değil.","Geniş 'sing' geçmiş için değil."]),
("My sister ___ her room when I got home.", ["was cleaning","cleaned","is cleaning","cleans"], 0,
 ["Correct: geçmişte süren → was cleaning.","'cleaned' tek seferlik; süren yok.","Şimdiki 'is cleaning' geçmiş için değil.","Geniş 'cleans' geçmiş için değil."]),
]
NEW["a2-19"] = [
("She hurt ___ while playing.", ["herself","himself","hers","her"], 0,
 ["Correct: she → herself.","'himself' eril; she için değil.","'hers' iyelik; dönüşlü değil.","'her' nesne zamiri; özneye dönüş yok."]),
("I taught ___ to cook.", ["myself","meself","me","mine"], 0,
 ["Correct: I → myself.","'meself' standart değil.","'me' dönüşlü değil.","'mine' iyelik; dönüşlü değil."]),
("The cat cleaned ___ in the sun.", ["itself","itselfs","it","his"], 0,
 ["Correct: it → itself.","'itselfs' çoğul yapılmaz.","'it' dönüşlü değil.","'his' eril iyelik; cat için değil."]),
("We should take care of ___.", ["ourselves","ourself","ours","us"], 0,
 ["Correct: we → ourselves.","'ourself' çoğul we için değil.","'ours' iyelik; dönüşlü değil.","'us' nesne; dönüşlü değil."]),
("You should be proud of ___.", ["yourself","youself","yours","your"], 0,
 ["Correct: you → yourself.","'youself' standart değil.","'yours' iyelik; dönüşlü değil.","'your' iyelik sıfatı."]),
("He asked ___ a question.", ["himself","hisself","him","his"], 0,
 ["Correct: he → himself.","'hisself' standart değil.","'him' dönüşlü değil.","'his' iyelik sıfatı."]),
("They organized the trip by ___.", ["themselves","theirselves","them","theirs"], 0,
 ["Correct: they + by + themselves.","'theirselves' standart değil.","'them' dönüşlü değil.","'theirs' iyelik; dönüşlü değil."]),
("She made ___ a cup of tea.", ["herself","himself","hers","she"], 0,
 ["Correct: she → herself.","'himself' eril; değil.","'hers' iyelik; dönüşlü değil.","'she' özne biçimi; burada olmaz."]),
("I need to work by ___ today.", ["myself","me","mine","myse"], 0,
 ["Correct: I + by + myself.","'me' dönüşlü değil.","'mine' iyelik; değil.","'myse' yok."]),
("The children dressed ___ quickly.", ["themselves","themself","them","their"], 0,
 ["Correct: children çoğul → themselves.","'themself' tekil kullanım; çoğul için değil.","'them' dönüşlü değil.","'their' iyelik sıfatı."]),
("You and I should help ___ to the cake.", ["ourselves","ownself","us","our"], 0,
 ["Correct: we → ourselves.","'ownself' standart değil.","'us' dönüşlü değil.","'our' iyelik sıfatı."]),
("He cut ___ while shaving.", ["himself","hisself","him","his"], 0,
 ["Correct: he → himself.","'hisself' standart değil.","'him' dönüşlü değil.","'his' iyelik sıfatı."]),
("We enjoyed ___ a lot at the beach.", ["ourselves","ourself","ours","us"], 0,
 ["Correct: we → ourselves.","'ourself' çoğul için değil.","'ours' iyelik; dönüşlü değil.","'us' dönüşlü değil."]),
("They blamed ___ for the accident.", ["themselves","theirselves","them","their"], 0,
 ["Correct: they → themselves.","'theirselves' standart değil.","'them' dönüşlü değil.","'their' iyelik sıfatı."]),
("I can do it by ___.", ["myself","myselfs","mine","me"], 0,
 ["Correct: by + myself.","'myselfs' çoğul değil (yok).","'mine' iyelik; dönüşlü değil.","'me' dönüşlü değil."]),
]
NEW["a2-20"] = [
("If you ___ it, the ice melts.", ["heat","will heat","heated","heating"], 0,
 ["Correct: zero cond. → if + geniş zaman (heat).","'will heat' zero'da will olmaz.","'heated' geçmiş; genel gerçek için değil.","'heating' yalın+ing uyumsuz."]),
("If we ___ late, we will miss the bus.", ["are","will be","were","being"], 0,
 ["Correct: first cond. if-cümlesi geniş → are.","'will be' if-cümlesinde will olmaz.","'were' geçmiş; first'te değil.","'being' çekimsiz."]),
("If it ___ next week, we'll stay home.", ["rains","will rain","rained","rain"], 0,
 ["Correct: if + geniş 3. tekil → rains.","'will rain' if-cümlesinde will olmaz.","'rained' geçmiş; gelecek koşul için değil.","'rain' it için -s gerekir."]),
("If I ___ enough money, I will buy a car.", ["have","will have","had","having"], 0,
 ["Correct: if + geniş → have.","'will have' if-cümlesinde will olmaz.","'had' geçmiş; first'te değil.","'having' çekimsiz."]),
("You will pass if you ___ hard.", ["study","will study","studied","studying"], 0,
 ["Correct: if + geniş → study.","'will study' if-cümlesinde will olmaz.","'studied' geçmiş; koşul geniş.","'studying' çekimsiz."]),
("If you mix red and blue, you ___ purple.", ["get","will gets","got","getting"], 0,
 ["Correct: zero cond. iki geniş → get.","'will gets' will+çekim çift hata.","'got' geçmiş; genel gerçek değil.","'getting' çekimsiz."]),
("If she ___ to the party, he will be happy.", ["comes","will come","came","coming"], 0,
 ["Correct: if + geniş 3. tekil → comes.","'will come' if-cümlesinde will olmaz.","'came' geçmiş; gelecek koşul için değil.","'coming' çekimsiz."]),
("We will play outside if it ___ .", ["doesn't rain","won't rain","didn't rain","not rain"], 0,
 ["Correct: if + geniş olumsuz → doesn't rain.","'won't rain' if-cümlesinde will olmaz.","'didn't rain' geçmiş; gelecek koşul değil.","'not rain' yardımcısız."]),
("If you touch fire, you ___ yourself.", ["burn","burns","burned","burning"], 0,
 ["Correct: zero cond. → you + yalın burn.","'burns' özne you için değil.","'burned' geçmiş; genel gerçek değil.","'burning' çekimsiz."]),
("If the shops are closed, we ___ buy anything.", ["can't","can","could not","will can't"], 0,
 ["Correct: zero cond. olasılık → can't.","'can' 'are closed' sonucuyla mantık ters.","'could not' geçmiş; genel sonuç için değil.","'will can't' çift yardımcı."]),
("I will call you if I ___ time.", ["have","will have","had","having"], 0,
 ["Correct: if + geniş → have.","'will have' if-cümlesinde will olmaz.","'had' geçmiş; first'te değil.","'having' çekimsiz."]),
("If you don't water the plants, they ___ .", ["die","will die","died","dying"], 0,
 ["Correct: zero cond. → they + die.","'will die' zero'da will olmaz.","'died' geçmiş; genel gerçek değil.","'dying' çekimsiz."]),
("When you heat water, it ___ .", ["boils","will boil","boiled","boiling"], 0,
 ["Correct: genel gerçek + when → it boils.","'will boil' genel gerçekte will olmaz.","'boiled' geçmiş; gerçek değil.","'boiling' çekimsiz."]),
("If we miss the train, we ___ a taxi.", ["will take","take","took","taking"], 0,
 ["Correct: first cond. ana cümle → will take.","'take' will'siz; gelecek sonuç değil.","'took' geçmiş; gelecek koşul değil.","'taking' çekimsiz."]),
("Plants die if they ___ enough water.", ["don't get","won't get","didn't get","not get"], 0,
 ["Correct: if + geniş olumsuz → don't get.","'won't get' if-cümlesinde will olmaz.","'didn't get' geçmiş; genel gerçek değil.","'not get' yardımcısız."]),
]

def js_str(s):
    return '"' + s.replace('\\','\\\\').replace('"','\\"').replace('\n',' ') + '"'

existing_qs = set(re.findall(r'"q":\s*"(.*?)",', open(PATH, encoding="utf-8").read(), flags=re.S))
src = open(PATH, encoding="utf-8").read()

def fmt_u(item):
    q, opts, a, why = item
    why_part = '' if why is None else ', \"why\": [' + ", ".join(js_str(x) for x in why) + ']'
    return ('    { "q": %s, "options": [%s], "a": %d%s },'
            % (js_str(q), ", ".join(js_str(o) for o in opts), a, why_part))

added = skipped_total = 0
for u, items in NEW.items():
    idx = src.index('  "' + u + '": [\n')
    close = src.index('\n  ]', idx)
    new_lines = [fmt_u(it) for it in items]
    skip = [i for i, it in enumerate(items) if it[0] in existing_qs]
    for i in sorted(skip, reverse=True):
        del new_lines[i]
    skipped_total += len(skip)
    added += len(new_lines)
    if new_lines:
        src = src[:close] + "\n" + "\n".join(new_lines) + src[close:]

open(PATH, "w", encoding="utf-8").write(src)
print("added:", added, "skipped(existing):", skipped_total)

# final validation
txt = open(PATH, encoding="utf-8").read()
qs = re.findall(r'"q":\s*"(.*?)",', txt, flags=re.S)
import collections
dups = sorted([k for k, v in collections.Counter(qs).items() if v > 1])
print("total questions:", len(qs))
print("duplicate stems:", dups)
for m in re.finditer(r'"([a-z]{2}-\d+)":\s*\[', txt):
    u = m.group(1); seg = txt[m.end():]; end = seg.index('\n  ],')
    print(u, seg[:end].count('"q":'))