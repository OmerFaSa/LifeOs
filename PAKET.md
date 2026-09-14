# LifeOS — dış inceleme paketi

Bu dosya elle yazılmaz: `python3 tools/paket.py` üretir.
İçinde kodun kendisi değil, kodun **iskeleti** vardır — harita,
modül yüzeyleri, doktrin başlıkları, ölçülmüş sayılar ve açık
sorular. Kaynak: <https://github.com/OmerFaSa/LifeOs>

## 1. Harita

| Sistem | Dosya | Satır | Test dosyası | Araç |
|---|---|---|---|---|
| **AYS** — Akademik Yol Sistemi | 105 | 41799 | 24 | 9 |
| **SPI** — Sağlık Performans İzleyicisi | 100 | 33221 | 24 | 11 |
| **ESP** — Entelektüel Seviye Planlayıcı | 112 | 33783 | 29 | 6 |
| **HKM** — Hayat Kontrol Merkezi | 44 | 7095 | 16 | 2 |

### En büyük 20 dosya

```
  2664  AYS/src/tests/office.test.js
  2049  AYS/src/js/core/office.js
  1482  SPI/src/js/screens/labs.js
  1438  ESP/src/js/app.js
  1337  AYS/src/js/core/llm.js
  1329  ESP/src/js/core/state.js
  1263  AYS/src/js/screens/office.js
  1232  SPI/src/js/app.js
  1214  AYS/src/js/app.js
  1197  AYS/src/js/core/state.js
   949  ESP/src/js/core/office.js
   895  SPI/src/js/core/state.js
   878  AYS/src/js/core/calc.js
   863  AYS/src/js/screens/today.js
   860  SPI/src/js/core/office.js
   845  AYS/src/js/screens/meeting.js
   833  AYS/src/js/screens/solve.js
   829  AYS/src/js/screens/guide.js
   822  AYS/src/js/core/ui.js
   812  AYS/src/tests/solver.test.js
```

## 2. Modül yüzeyleri

Her modülün DIŞA AÇTIĞI isimler. Gövde yok: bir incelemenin
başlangıcı ne yapıldığı değil, neyin çağrılabilir olduğudur.

### AYS

```
analytics.js                       compareExams, blankStrategy, errorHeatmap, rankHistory, publisherAdjust, speedAccuracy, topicValue, forgettingCurve, sleepImpact, capacityReality, leechCards, warmup, distractionTrend,
audit.js                           of, all, count, AREAS, ASGARI, SULUK, IKINCI_TEST_GECIKME
auto.js                            draftWeek, applyDraft, suggestBehaviorGoal, syncDayBlocks, suggestions, onDayOpen, driftStreak, closeWeekDraft
beacon.js                          load, save, settings, collect, payload, preview, contract, metric, urlOk, due, send, ping, pair, backfill, levelOf, LEVELS, intents, answerIntent, applyIntent, INTENT_KINDS, MODULE, CONTRACT, LABELS, ASGARI_ARA_DK
calc.js                            fullExams, comparableNets, medianTrend, examBase, testMedian, analysisDebt, examVolumeProgress, errorDistribution, errorPareto, topTags, openErrors, dueCards, overdueCards, cardDebt, weekBlocks, planCompletion, questionRealization, timeRealization, plannedMinutes, capacityLoad, completionHistory, skipReasonCounts, subjectClosure, overallClosure, examClosure, pendingSecondChecks, sleepAverage, inte
calib.js                           open, settle, remove, load, norm, list, settled, openList, due, error, bandOf, errKind, bias, score, kindOf, forExam, ASGARI, PENCERE
components.js                      Card, Box, Collapsible, Stat, Bar, Meter, Badge, Chip, Button, IconButton, Segmented, Subtabs, Entry, Ledger, PickCard, Toolbar, Field, Input, Textarea, Select, Checkbox, Notice, Empty, Skeleton, Busy, NextUp, Table, Pager, paginate, Mic, Drop, Grid, Span, Stack, Cols, Row, SectionTitle,
entry.js                           fromText, parseOne, yanCumleler, dersBul, konuBul, sayi, ilkSayi, parseSoru, parseUyku, parseParagraf, parseProblem, parseSure
examrun.js                         MARKS, start, active, currentTest, elapsedTotal, elapsedTest, remaining, pause, resume, isPaused, mark, undoMark, nextTest, gotoTest, summary, finish, cancel
friction.js                        tick, blur, save, load, day, verdict, relief, workMinutes, window:window_, BUTCE_DK, ORAN_ESIK, PENCERE, CANLI_SN
goodhart.js                        PAIRS, windows, pair, scan, flags, brief, policy, DIRECTIONS, PENCERE, CABA_ARTIS, SONUC_DURGUN
h.js                               html, raw, isRaw, val, when, cls, attrs, map, esc
journal.js                         METRICS, OPS, metricList, verify, say, record, forAgent, forBrief, prune, clear, all, detect, DETECTORS, trust, trustAll, ownerOf, load, MAX_PER_AGENT,
listen.js                          supported, start, stop, isActive, dictateInto, message
llm.js                             initBuiltin, builtinReady, getKey, getKeys, setKey, addKey, removeKeyAt, clearKeys, maskKey, maskKeys, pickKey, keyOwner, keyProblem, chat, complete, test, ready, diagnose, listModels, modelsFor, cachedModels, clearCatalog, MODEL_STORE, errorText, retryable, resumable, offline, onceOnline, inSandbox, KEY_STORE, truncated, trimToSentence, joinContinuation, dropLastWord, stripThinking, endpointFor, 
office.js                          /* ayar */ defaultSettings, settings, saveSettings, agentConfig, chainFor, ready, mode, providerLabel, /* brifing */ brief, resetBriefs, snapshot, ruleText, nextAction, recentSaid, compactData, /* dogrulama ve kart uretimi (eski koc katmanindan devralindi) */ validate, validateCards, generateCards, noteContext, parseJson, numbersIn, numberFidelity, scopeBreaches, supportedNumbers, /* sohbet */ ask
palette.js                         open, close, isOpen, openFocus, closeFocus, isFocusOpen, showShortcuts, runningBlock, veriKaydet, veriKomutu, commands
planner.js                         LEVELS, PHASES, levels, level, phaseAt, topicDays, pool, weeklyQuestions, topicsPerWeek, gateWeeks, generate, health, replan, scenarios, checkPrerequisites, energyByWeekday
proposals.js                       all, pending, applied, actionable, check, preview, propose, approve, reject, undo, clearResolved, suggest, refresh, fromModel, catalogPrompt, splitAction, stripTrailingJson, load, save, MAX,
quiz.js                            MODES, SIZES, FORMATS, TIMERS, pool, start, active, current, reveal, isRevealed, pick, pickedIndex, format, questionSeconds, questionLeft, timeout, progress, answer, skip, finish, cancel, availability
quota.js                           acquire, release, penalize, check, status, estimateMs, effective, limitsFor, reset, setOverride, getOverride, clearOverrides, SAFETY, MAX_WAIT_MS, STORE, OVERRIDE_STORE
setup.js                           needed, open, render, next, back, save, quick, card, setLevel, toggleWeak, preview, previewHtml, nextMonday, refreshPreview, STEPS
signals.js                         load, sync, current, markSeen, answer, dismiss, efficacy, screenVerdict, list, open, closed, norm, SOGUMA_GUN, OMUR_GUN
solver.js                          catalogText, matchTopic, parse, verify, sameAnswer, optionLetter, numbersOf, check, arbitrate, verifyRun, talk, prepareImage, solve, ready, chainFor, all, newRecord, save, remove, load, byTopic, daily, summary, solvedOk, MAX_EDGE, MAX_BYTES, MAX_RECORDS,
sources.js                         all, byId, newSource, save, remove, load, seed, recordsOf, overallRate, measure, relative, sentence, table, ladderWarning,
state.js                           weekStart, weekEnd, weekId, weekDates, weekOf, currentWeek, daysUntilStart, programProgress, phaseOf, curriculumFor, defaultWeek, ensureWeek, saveWeek, defaultDay, ensureDay, saveDay, dayOf, ensureTopics, topicState, setTopicState, examNet, testNet, saveExam, deleteExam, blankCertainty, blankKnown, saveError, deleteError, newCard, saveCard, deleteCard, schedule, prioritizedDue, saveReview, saveDec
storage.js                         load, sample, breakdown, growth, horizon, prunable, prune, verdict, fmtBytes, BUDANABILIR, ICERIK, UFUK_GUN, ORNEK_LIMIT
talk.js                            supported, sesliCevapVar, start, stop, kes, isActive, durum, SESSIZLIK_MS, SIRA_GECIS_MS
tools.js                           TOOLS, forSample, sanitize, resetCache, durum, denemeler, hatalar, konular, haftalar, gunler, hedef, kartlar, videoNotlari, mesgaleler, enerjiDurumu, gununAkisi, konuRiski, puanTahmini
ui.js                              icon, trend, motif, gauge, tagDot, certainty, provenance, paretoBars, lineChart, barChart, donut, sparkline, stackBar, heatmap, legend, rangeBar, macroSplit, hint, rail, openHint, closeHint, isHintOpen, sheet, closeSheet, isSheetOpen, toast, confirmSheet, busy, idle, withBusy,
utils.js                           MONTHS, MONTHS_SHORT, DAY_MS, pad2, iso, parse, isISO, today, todayISO, addDays, diffDays, weekdayIndex, fmtDate, fmtShort, fmtRange, monthName, monthKey, relativeDay, median, round, clamp, sum, pct, fmtNet, fmtNum, fmtMin, fmtClock, esc, uid, slug, plural, norm, debounce,
voice.js                           available, load, voices, voiceCount, assign, profileFor, speak, cancel, readMs, holdMs, chunks, sentences, budgetMs, score, quality, byURI, speechText, overrides, PROFILES, PACE, PACE_ORDER, paceOf, LANG, CHUNK, MIN_HOLD, SPELL,
build.py                           read, minify_css, minify_js, inline_css, inline_js, stamp, build
devserver.py                       main
```

### SPI

```
audit.js                           of, all, count, AREAS, ASGARI, TAHLIL_ESKI_GUN, BAYRAK_GUN
beacon.js                          load, save, settings, collect, payload, preview, contract, metric, urlOk, due, send, ping, pair, backfill, levelOf, LEVELS, intents, answerIntent, applyIntent, INTENT_KINDS, MODULE, CONTRACT, LABELS, ASGARI_ARA_DK
bio.js                             STATUS, MIN_POINTS, BASELINE_MIN, FASTING_MARKERS, needsFasting, fastingOf, interpretable, refFor, statusOf, statusNote, trendOf, trendVerdict, baselineOf, meaningfulChange, PATTERNS, patterns, panelRows, summary, attention, overdue,
calc.js                            minimumDay, streak, dayStatus, nextAction, correlate, pairsFor, crossFindings, SERIES, LINKS, MIN_PAIRS, weeklyReport, headline,
calib.js                           open, settle, remove, load, norm, list, settled, openList, due, error, bandOf, errKind, bias, score, kindOf, forLab, ASGARI, PENCERE
components.js                      Card, Collapsible, Stat, Bar, Meter, Badge, Chip, Button, IconButton, Segmented, Subtabs, Entry, Ledger, PickCard, Toolbar, Field, Input, Textarea, Select, Checkbox, Notice, Empty, Skeleton, Busy, NextUp, Table, Pager, paginate, Mic, Drop, Grid, Span, Stack, Cols, Row, SectionTitle,
evidence.js                        of, resolve, gradeOf, authorityOf, effectiveOf, mayDirect, cap, line, temper, coverage, audit, disputed, policy, SOURCES:SP.EVIDENCE_SOURCES, AUTHORITY:SP.EVIDENCE_AUTHORITY, GRADES:SP.EVIDENCE_GRADES
extract.js                         supported:modelReady, modelReady, isImage, isPdf, isText, readText, readDataUrl, fromLabFile, fromMealPhoto, fromReceipt, fromFoodLabel, parseJson, send, MAX_BYTES,
friction.js                        tick, blur, save, load, day, verdict, relief, trainingMinutes, window:window_, BUTCE_DK, PENCERE, CANLI_SN
goodhart.js                        PAIRS, windows, pair, scan, flags, brief, policy, DIRECTIONS, PENCERE, CABA_ARTIS, SONUC_DURGUN
h.js                               html, raw, isRaw, val, when, cls, attrs, map, esc
llm.js                             initBuiltin, builtinReady, getKey, getKeys, setKey, addKey, removeKeyAt, clearKeys, maskKey, maskKeys, pickKey, chat, complete, test, ready, errorText, retryable, resumable, offline, onceOnline, inSandbox, KEY_STORE, truncated, trimToSentence, joinContinuation, dropLastWord, DEFAULT_MAX_TOKENS,
meds.js                            activeOn, all, activeList, kindOf, affecting, changedBetween, explainChange, changeNote, markerNote, distorts, BOZAN
memo.js                            of, baslat, bitir, boyut, acikMi
money.js                           priceOf, costOf, monthsSince, ageBand, estimateShare, budget, basketRows, basketTotal, basketCoverage, substitutesFor, swapOpportunities, costPerNutrient, bulkOpportunities, status,
move.js                            baseline, sleepScore, hrvScore, rhrScore, sorenessScore, readiness, sessionLoad, loadOn, loadWindow, acwr, deloadWeek, weeklyGrowth, prescription, progressionCheck, patternBalance, loadSeries, ADVANCE_SESSIONS, ADVANCE_WINDOW,
nutri.js                           MICROS, LAB_LINKS, ABSORB_BASE, bmr, tdee, activityFactor, baseRda, labAdjust, targets, contribution, portionGrams, absorbMeal, dayTotals, windowAverage, gaps, sourcesFor, householdSplit,
office.js                          defaults, settings, saveSettings, cfgFor, ready, brief, labBrief, nutriBrief, moveBrief, moneyBrief, patronBrief, ruleText, systemPrompt, validate, ask, historyFor, HAFIZA_TUR, notes, handoffs, handoffsFor, agendaCandidates, dailyBriefing, runMeeting, send, clearChat, load,
palette.js                         open:openPalette, close, isOpen, runById, showShortcuts, commands, quickCommand, saveQuick
parts.js                           cert, markerRow, flagCard, avatar, sourceBadge, nutCell, minRow, clinicalNote, absorbNote, empty
proposals.js                       KATALOG, eylem, katalogIdleri, catalogPrompt, check, preview, fromText, fromModel, yanCumleler, quickToAction, propose, approve, reject, undo, clearResolved, pending, all, load, save, MAX,
quickentry.js                      parse, apply, parseVital, parseMove, VITAL_FIELDS
quota.js                           acquire, release, penalize, check, status, estimateMs, effective, limitsFor, reset, setOverride, getOverride, clearOverrides, SAFETY, MAX_WAIT_MS, STORE, OVERRIDE_STORE
setup.js                           needed, open, save, skip
signals.js                         load, sync, current, markSeen, answer, dismiss, efficacy, screenVerdict, list, open, closed, norm, SOGUMA_GUN, OMUR_GUN
speak.js                           supported, ready, hasTurkish, voices, turkishVoices, voiceFor, styleFor, konusulacak, say, sequence, stop, isSpeaking, speakingAgent, onVoicesReady, parcala, cumleler, emniyetMs, KIMLIK, PARCA,
state.js                           /* profil ve hane */ defaultProfile, saveProfile, ageOf, defaultPrefs, savePrefs, householdList, addHouseholdMember, removeHouseholdMember, switchProfile, activeProfileId, /* tahlil */ newLab, saveLab, deleteLab, applyDerived, seriesOf, latestOf, latestAll, /* gunluk olcum */ defaultVitals, vitalsOf, ensureVitals, saveVitals, /* ogun */ mealsOf, newMeal, saveMeals, addMeal, deleteMeal, /* antrenma
storage.js                         load, sample, breakdown, growth, horizon, prunable, prune, verdict, fmtBytes, BUDANABILIR, ICERIK, UFUK_GUN, ORNEK_LIMIT
symptom.js                         ofDay, setSymptom, window:window_, forMarker, periods, cycle, cycleNote, CYCLE_SENSITIVE, CYCLE_DEFAULT
talk.js                            supported, sesliCevapVar, start, stop, kes, isActive, durum, agent, SESSIZLIK_MS, SIRA_GECIS_MS,
ui.js                              icon, trend, motif, gauge, lineChart, barChart, donut, sparkline, stackBar, heatmap, legend, rangeBar, macroSplit, hint, rail, openHint, closeHint, isHintOpen, sheet, closeSheet, isSheetOpen, toast, confirmSheet, busy, idle, withBusy,
utils.js                           MONTHS, MONTHS_SHORT, DAY_MS, pad2, iso, parse, isISO, today, todayISO, addDays, diffDays, weekdayIndex, lastDays, fmtDate, fmtShort, fmtRange, monthName, monthKey, relativeDay, median, round, clamp, sum, pct, fmtNet, fmtNum, fmtMin, fmtClock, esc, uid, slug, plural, norm, debounce,
voice.js                           supported, start, stop, isActive, activeTarget, dictateInto, message
build.py                           read, minify_css, minify_js, inline_css, inline_js, stamp, build
devserver.py                       main
```

### ESP

```
acoustic.js                        CLEAN_STREAK, CLEAN_WINDOW_DAYS, PLATEAU_DAYS, BPM_STEP, WPM_BAND, beatMs, beatsOfBar, cleanThreshold, logAttempt, nextStep, plateaus, progressRatio, musicStatus, wpmOf, errorRateOf, dictionStatus, dictionTrend,
audit.js                           of, all, count, dueForecast, repeatedWords, ASGARI, SULUK_LAPSE, BAYAT_GUN, ACIK_GUN
beacon.js                          load, save, settings, collect, payload, preview, contract, metric, urlOk, due, send, ping, pair, backfill, levelOf, LEVELS, intents, answerIntent, applyIntent, INTENT_KINDS, MODULE, CONTRACT, LABELS, ASGARI_ARA_DK
calib.js                           open, settle, remove, load, norm, list, settled, openList:open_, due, error, bandOf, errKind, bias, score, kindOf, ASGARI, PENCERE,
chrono.js                          spread, centuryGaps, contemporaries, sourceBalance, critiqueDepth, unsourcedLinks, unbalancedChains, explained, retention, cardsFor, status, findings, drill,
coach.js                           prescribe, plan, logDrill, doneToday, historyOf, minimumDay, sentence, dailyBase, advances:hits
components.js                      Card, Collapsible, Stat, Bar, Meter, Badge, Chip, Button, IconButton, Segmented, Subtabs, Entry, Ledger, PickCard, Toolbar, Field, Input, Textarea, Select, Checkbox, Notice, Empty, Skeleton, Busy, NextUp, Table, Pager, paginate, Mic, Drop, Grid, Span, Stack, Cols, Row, SectionTitle,
curriculum.js                      METRICS, metricNames, measure, gateStatus, stepOf, stepStatus, levelOf, all, overall, masteryPct, nextGate, roadmap, placement, sentence, ladder, traditionsRead, selfReported, declaredCount, ASGARI_BEYAN,
desk.js                            TABS, proposals, agentOf, tab, setTab, isOpen, toggle, messages, ask, lastAnswer, speakLast, talk, talking, assets, assetSummary, reminders, due, reminderSummary, briefExtras, headline
friction.js                        tick, blur, save, load, day, verdict, relief, adminMinutes, workMinutes, window:window_, BUTCE_DK, ORAN_ESIK, PENCERE, CANLI_SN,
goodhart.js                        PAIRS, windows, pair, scan, flags, brief, policy, DIRECTIONS, PENCERE, CABA_ARTIS, SONUC_DURGUN, ASGARI_CABA
h.js                               html, raw, isRaw, val, when, cls, attrs, map, esc
intellect.js                       /* hacim */ hoursOf, qualityCoef, ehs, /* sentez */ syntopic, unlinkedNotes, linkSuggestions, /* arguman */ openArguments, stalledArguments, checkFallacies, FALLACIES, /* yazi */ readability, bandOf, syllables, repeats, draftRatio, wordsWritten,
lesson.js                          units, unitOf, itemsOf, cardsOf, progress, addUnit, KNOWN_BOX, topics, topicOf, topicMarks, topicProgress, markTopic, topicSummary, start, question, answer, result, log, correct, norm, shuffle
llm.js                             initBuiltin, builtinReady, getKey, getKeys, setKey, addKey, removeKeyAt, clearKeys, maskKey, maskKeys, pickKey, chat, complete, test, ready, errorText, retryable, resumable, offline, onceOnline, inSandbox, KEY_STORE, truncated, trimToSentence, joinContinuation, dropLastWord, DEFAULT_MAX_TOKENS,
memo.js                            of, baslat, bitir, boyut, acikMi
modules.js                         defaults, map, isOn, active, activeIds, activeRoutes, count, agentOn, activeAgents, set, setAll, footprint
office.js                          defaults, settings, saveSettings, cfgFor, ready, brief, langBrief, philoBrief, musicBrief, dictionBrief, readingBrief, historyBrief, coachBrief, writingBrief, patronBrief, ruleText, systemPrompt, validate, ask, historyFor, HAFIZA_TUR, notes, handoffs, handoffsFor, agendaCandidates, dailyBriefing, runMeeting, send, clearChat, load,
palette.js                         open:openPalette, close, isOpen, runById, showShortcuts, commands, quickCommand, saveQuick
parse.js                           AYRAC, ALIASES, parseSession, parseVocab, parseArgument, extractConcepts
parts.js                           cert, measure, avatar, discChip, radar, empty, desk, deskRx, deskChat, deskMap, deskAssets, deskReminders, deskPlans, deskAudit, units, practice, proposalList, weekPlan, rx:rxList, topics
planner.js                         RETENTION_FLOOR, RETENTION_MIN_CARDS, DEADLINE_DAYS, BALANCE_WINDOW, blockedCore, deadlines, overdue, overdueDeck, synthesisGap, nextAction, balance, weeklyRoute, crossFindings,
plans.js                           KINDS, KIND_BY_ID, allowed, discOf, stillApplied, proposalsFor, all, open:open_, record, accept, decline, weekPlan, savePlan, plan, clearPlan, today
quota.js                           acquire, release, penalize, check, status, estimateMs, effective, limitsFor, reset, setOverride, getOverride, clearOverrides, SAFETY, MAX_WAIT_MS, STORE, OVERRIDE_STORE
setup.js                           needed, open, save, skip, pick, picked
signals.js                         load, sync, current, markSeen, answer, dismiss, efficacy, screenVerdict, list, open, closed, norm, SOGUMA_GUN, OMUR_GUN
speak.js                           supported, ready, hasTurkish, voices, turkishVoices, voiceFor, styleFor, konusulacak, say, sequence, stop, isSpeaking, speakingAgent, onVoicesReady, parcala, cumleler, emniyetMs, KIMLIK, PARCA,
srs.js                             BOXES, GRADES, GRADE_BY_ID, EASE_START, EASE_MIN, EASE_MAX, boxDays, schedule, answer, dueCards, overdueDays, stabilityOf, retentionOf, retention, boxCounts, activeCount, deckStatus, answeredIn,
state.js                           /* profil */ defaultProfile, saveProfile, defaultPrefs, savePrefs, profileList, addProfile, removeProfile, switchProfile, activeProfileId, /* gun ve oturum */ newDay, dayOf, ensureDay, saveDay, dayHasEntry, sessionsOf, minutesOf, addSession, updateSession, deleteSession, recentDays, streak, /* dil */ newCard, saveCard, deleteCard, cardsOf, /* felsefe */ newArgument, saveArgument, deleteArgument, a
storage.js                         load, sample, breakdown, growth, horizon, prunable, prune, verdict, fmtBytes, BUDANABILIR, ICERIK, UFUK_GUN, ORNEK_LIMIT
talk.js                            supported, sesliCevapVar, start, stop, kes, isActive, durum, agent, SESSIZLIK_MS, SIRA_GECIS_MS,
timer.js                           SUPHE_SAAT, start, pause, resume, stop, reset, load, elapsedMs, minutes, clock, running, active, disc, suspicious, state
ui.js                              icon, trend, motif, gauge, lineChart, barChart, donut, sparkline, stackBar, heatmap, legend, rangeBar, macroSplit, hint, rail, openHint, closeHint, isHintOpen, sheet, closeSheet, isSheetOpen, toast, confirmSheet, busy, idle, withBusy,
utils.js                           MONTHS, MONTHS_SHORT, DAY_MS, pad2, iso, parse, isISO, today, todayISO, addDays, diffDays, weekdayIndex, lastDays, fmtDate, fmtShort, fmtRange, monthName, monthKey, relativeDay, median, round, clamp, sum, pct, fmtNet, fmtNum, fmtMin, fmtClock, esc, uid, slug, plural, norm, debounce,
voice.js                           supported, start, stop, isActive, activeTarget, dictateInto, message
build.py                           read, minify_css, minify_js, inline_css, inline_js, stamp, build
devserver.py                       main
```

### HKM

```
certainty.py                       is_valid, metric, value_of, known
channels.py                        settings, enabled, allowed, send, verify_signature, verify_challenge, parse_whatsapp, verify_telegram_secret, parse_telegram
cross.py                           series, pair, scan, findings
db.py                              connect, insert_event, insert_audit, insert_decision, current_decision, set_decision_state, sources_of, events_between, latest_payloads, answered_decisions, decisions_of, open_decision, decision, export_all, prune_events, insert_intent, intents_for, intent, set_intent_state, import_all
dil.py                             kucult, sadelestir, kok, kelimeler, terimler, zaman, puanla, olumsuz, parse, sure_dakika, gun_kaydirma, alan, istek, cozum_tarihi, ifade
impact.py                          build_cache, one, scan, summary
intents.py                         validate, create, take, answer, summary
manager.py                         imperatives, advisory, brief, carry, respond
outbox.py                          enqueue, due, flush, status
patron.py                          parse, understand, daily_message, respond, log, history, already_sent
precedence.py                      resolve
schedule.py                        settings, due, run, tick
settings.py                        mask, read, validate, apply, write
streak.py                          series, scan, findings
sync_engine.py                     check_token, validate, ingest, latest_audits
thresholds.py                      from_config, load
twin.py                            snapshot, series, coverage, blind
vp_academic.py                     audit, deadline_days
vp_base.py                         finding, verdict_of, read
vp_bio.py                          audit, red_flag
vp_intellect.py                    audit, blocked_core
weekly.py                          report, message
daemon.py                          cors_origin, load_config, briefing, main
hkm.py                             yaz, komut_durum, komut_hafta, komut_capraz, komut_seri, komut_etki, komut_kararlar, komut_kutu, komut_niyetler, komut_sor, komut_yedek, main
kur.py                             satir, oku, varsayilanlar, birlestir, daemon_durumu, kur, main
```

## 3. Doktrin — bu depoda neyin YAPILMADIĞI

Aşağıdakiler belgelerin kendi başlıklarıdır; öneri getirirken
bunları bilmeyen bir eleştiri, var olan bir kuralı «eksik» sanar.

**README.md**

- LifeOS
- Üçü neyi paylaşır
- Üçü neyi paylaşmaz
- Çalıştırma
- Sınırlar

**HKM/MIMARI.md**

- HKM — Hayat Kontrol Merkezi
- 1. Ne olduğu ve ne OLMADIĞI
- 2. Bağımlılık istisnası
- 3. VP Konseyi — LLM'e HİÇ dokunmaz
- 4. Kesinlik sınırı geçince kaybolmaz
- 5. Çelişki çözümü — HKM.PRECEDENCE
- 6. Şema — ve spec'teki üç düzeltme
- 7. Güvenlik
- 8. Çalıştırma
- 8.5 Dijital ikiz ve Yönetici (Faz 3)
- `core/twin.py` — bir resim, üç modül
- `core/manager.py` — karar üretmez, karar taşır
- 8.6 İşaret (Faz 6) — ve tarayıcının getirdiği sınır
- Geçmiş gönderimi — ve geriye dönük dürüstlük
- Tarayıcı sınırı: CORS
- 8.7 Yerel yüz — `web/index.html`
- 8.8 Çapraz bulgu — `core/cross.py`
- 8.9 Büyük Patron ve kanallar (Faz 4–5)
- Hiyerarşi — ve her katmanın NE YAPMADIĞI
- `core/channels.py` — bir kolaylık değil, bir risk yüzeyi
- Uç noktalar ve kimlik
- 8.10 Etki — `core/impact.py`
- Şema taşıma
- 8.11 Yönetim — `core/settings.py`
- 8.12 Dil — `core/dil.py` (Faz 8)
- En tehlikeli kör nokta: olumsuzluk
- 8.13 Niyet kuyruğu — `core/intents.py` (Faz 9)
- 8.14 Ritim, giden kutusu ve haftalık rapor

**ESP/src/MIMARI.md**

- ESP — Entelektüel Seviye Planlayıcı
- 1. Temel doktrin
- 1.1 Kural motoru otoritedir
- 1.2 Uydurulmuş sayı, ölçülmüş sayı gibi gösterilmez
- 1.3 Pedagojik sınır
- 2. Modüller ve kod karşılıkları
- Modül 0 — Merdiven ve koç (`core/curriculum.js`, `core/coach.js`)
- Modül 0.5 — Bölümler, tezgâh, ders ve teklif
- Modül 1 — Aralıklı tekrar (`core/srs.js`)
- Modül 2 — Entelektüel hacim ve sentez (`core/intellect.js`)
- Modül 3 — Akustik (`core/acoustic.js`)
- Modül 3.5 — Kronoloji (`core/chrono.js`)
- Modül 4 — Orkestrasyon (`core/planner.js`)
- 3. Bölümler
- 4. Sıfır sürtünme
- 5. Güvenlik ve mahremiyet
- 6. Kod düzeni
- Bağımlılık
- 7. Dürüstlük katmanı — sistemin kendini denetlemesi
- Sürtünme — `core/friction.js`
- Goodhart nöbetçisi — `core/goodhart.js`
- Kalibrasyon defteri — `core/calib.js`
- Merdivenin kör noktası — `data/curriculum.js` → `blind[]`
- Sinyal katmanı — `core/signals.js`
- Beyana dayalı kapı — `core/curriculum.js`
- Nerede görünür
- 8. Ölçülmüş durum
- 9. Bilinçli olarak ertelenenler

**SPI/src/MIMARI.md**

- SPİ — Sağlık Performans İzleyicisi
- 1. Temel doktrin
- Kural motoru otoritedir
- Uydurulmuş sayı, ölçülmüş sayı gibi gösterilmez
- Klinik sınır
- 2. Modüller ve kod karşılıkları
- Modül 1 — Biyometrik veri ve laboratuvar
- Modül 2 — Beslenme ve biyoyararlanım
- Modül 3 — Hareketlilik, yük yönetimi ve toparlanma
- Modül 4 — Sağlık ekonomisi
- Modül 5 — Baş danışman ve orkestratör
- 3. Bölümler
- Günlük neden tek sayfa ve neden ilk sırada?
- Testler organ bazlı değildir
- Hareket alanlara ayrılır
- Koçlar birbiriyle konuşur
- Fiyat neden internetten gelmiyor?
- 4. Sıfır sürtünme
- 5. Güvenlik ve mahremiyet
- 6. Kod düzeni
- Bağımlılık
- 7. Kanıt katmanı — eşikler nereden geliyor
- 8. Yol haritası durumu
- 9. Kardeş proje

**AYS/src/OFIS.md**

- Ofis — altı ajanlı çalışma ekibi
- Temel ilke: kural motoru otoritedir
- Üç ekran
- Ofis ekranı iki görünüm taşır
- Toplantı akışı
- Rapor
- Karar takibi
- Ajanlar rapor okumaz, konuşur
- Gelen mesaj önce sınıflanır
- Konu anlatmak serbesttir, adayın sayıları değil
- Konuşma kaydı — her isteme eklenir
- Toplantı bir tutanak değil, bir konuşma
- Ses ve okuma ritmi — biri bitmeden diğeri başlamaz
- Her ajanın kendi sesi
- Model yokken de sohbet edilir
- Ücretsiz modeller
- Anahtar biçimi — engellemez, söyler
- Google anahtarı başlıkla gider
- Uç adresi sızmaz, eksik yazılan tamamlanır
- İstek sınırı hiç aşılmaz
- Katalog eskir — ve bu artık arıza değil
- Anahtar nerede durur
- Çoklu anahtar
- Çevrimdışı
- Yedek zinciri
- Yanıt bütünlüğü — cümle yarıda kalmaz
- Akıl yürütmenin iç sesi cevaba karışmaz
- Hata gövdesi okunur


## 4. Ölçülmüş sayılar

Bu tablo elle yazılmaz; `tools/sayilar.py` araçları koşturur ve her aracın kendi son satırını yazar.

_Bu bölüm elle yazılmaz: `python3 tools/sayilar.py --yaz` araçları koşturur ve her aracın kendi son satırını buraya yazar. Son koşum: 2026-09-14._

| Araç | AYS | SPI | ESP |
|---|---|---|---|
| `runtests.js` | 1044/1044 gecti | 786/786 gecti | 604/604 gecti |
| `smoke.js` | Duman testi temiz — 2 hedefte 36 ekran, 36 sekme gezildi. | Duman testi temiz — 2 hedefte 24 ekran, 64 sekme gezildi. | Duman testi temiz — 2 hedefte 28 ekran, 182 sekme gezildi. |
| `a11ycheck.js` | erisilebilirlik temiz (1 bilinen eksik izin listesinde) | erisilebilirlik temiz (1 bilinen eksik izin listesinde) | erisilebilirlik temiz (4 bilinen eksik izin listesinde) |
| `palettecheck.js` | 924 kontrast ölçümü AA geçti — en dar pay: ucuncul/zemin 4.52 (asgari 4.5) — light/indigo/today | 1694 kontrast olcumu AA gecti — en dar pay: ucuncul/zemin 4.52 (asgari 4.5) — light/indigo/today | 1848 kontrast ölçümü AA geçti — en dar pay: ucuncul/zemin 4.52 (asgari 4.5) — light/indigo/today |
| `layoutcheck.js` | Telefon düzeni temiz — 390 pikselde 36 yerde taşma yok, bütün dokunma hedefleri 24px ve üstü. | Telefon düzeni temiz — 390 pikselde 44 yerde taşma yok, bütün dokunma hedefleri 24px ve üstü. | Telefon düzeni temiz — 390 pikselde 105 yerde taşma yok, bütün dokunma hedefleri 24px ve üstü. |
| `perfcheck.js` | Bütün ekranlar bütçede — en ağırı office 31.2 ms (bütçe 120). | Bütün ekranlar bütçede — en ağırı office 20.9 ms (bütçe 120). | Bütün ekranlar bütçede — en ağırı office 54.9 ms (bütçe 100). |
| `ledgercheck.js` | — | 32 ekran/sekmede defter düzeni temiz | — |
| `designcheck.js` | — | beş düzen temiz — 440 ekran/genişlik kombinasyonu bakıldı | — |

| Depo denetimi | Sonuç |
|---|---|
| `HKM tests` | 184/184 test gecti |
| `HKM perf` | Bütün sorgular bütçede. |
| `HKM yuz` | HKM yüzü temiz — 16 görünümde taşma yok, bütün hedefler 24px ve üstü, etiketler yerinde, kontrast AA. |
| `entegre.js` | Butunlesme temiz: uc arayuz de HKM ile konustu, HKM kapaliyken hicbiri bozulmadi. |

## 5. Son 25 commit (toplam 134)

```
1214ec4 Belgelerdeki sayilar yenilendi ve HKM komutlari README'ye eklendi
3d110ab HKM yuzu artik denetleniyor — ve ilk kosumda uc kusur buldu
2caeab7 HKM: seri katmani, dokuz aylik ufuk olcumu ve geri yukleme
b3fc96a HKM: ritim, giden kutusu, haftalik rapor, sinirlar ve terminal
92f12b8 HKM Faz 8-9: dogal dil ve niyet kuyrugu
5ca6c27 Belgelerdeki sayilar yenilendi
ec30661 HKM Faz 7: yonetim merkezi — maskeli okuma, dogrulamali yazma, yedek, budama
7a79846 HKM Faz 6: etki — HKM'nin kendi faydasini olcmesi
7adb7b9 HKM Faz 5: veri merkezi — uc sekme ve ham seri
4c2617a HKM Faz 3: ambar genisletme — kapsam secimi ve gecmis gonderimi
a836f90 HKM Faz 2: tek komutla kurulum ve jetonsuz esleme
a2415f5 ANALIZ.md — sistem analizi ve mimari yol haritasi
25934cb HKM: Telegram webhooku ve kurulum belgesi
442a959 Belgelerdeki sayilar yenilendi (sayilar.py --tam)
3a01f8d HKM: capraz bulgu, Buyuk Patron ve kanal katmani (WhatsApp geciti)
e438e2c Goodhart: yon ve politika artik ekranda gorunuyor
b2c8200 HKM'nin yuzu: brifing okunabilir ve oneri cevaplanabilir oldu
764a613 HKM Faz 6: uc arayuzden isaret — ve tarayicinin getirdigi sinir
8e7a355 HKM Faz 3: dijital ikiz, Yonetici ve oneri yasam dongusu
6caa941 Sayilar tek kaynaktan: tools/sayilar.py
d9dcfaf Kalibrasyon: hata olcusu artik degiskene gore secilir
6944552 AYS ve ESP'de de etkin yetki; «yerel» artik kendi verini cezalandirmiyor
c9d6e56 Goodhart yon anlambilimi ve SPI'de etkin yetki
2defb8d Araclar: telefon duzeni ve dokuz aylik cizim maliyeti uc sistemde de
77c683b SPI: bakim borcu denetimi — bes alanda 14 bulgu
```

## 6. İncelemeden beklenen — ve beklenmeyen

**Beklenen (bu sırayla):**

1. **Yanlış olan bir şey göster.** Bir dosya:satır ver, neyin yanlış
   olduğunu ve hangi girdi ile bozulduğunu yaz. «Şu daha iyi olurdu» bir
   bulgu değildir; «şu girdi ile şu çıktı yanlış» bir bulgudur.
2. **Doktrinin kendisini eleştir.** Kural motoru otoritedir, eksik veri
   sıfır değildir, model sayı üretmez, HKM'ye bağımlılık tek yönlüdür.
   Bunlar seçimdir; yanlış seçim olduklarını düşünüyorsan **neyi imkânsız
   kıldıklarını** göster.
3. **Ölçülmeyeni söyle.** Bu depo kendi kendini ölçmeye çalışıyor
   (sürtünme, Goodhart, kalibrasyon, kanıt eksenleri, etki, kapsama).
   Hangi önemli şey hâlâ ölçülmüyor?
4. **Dokuz aylık ufku hedefle.** On yıllık mimari tavsiyesi istemiyorum;
   dokuz ay boyunca her gün kullanılacak bir sistem için ne kırılır?

**Beklenmeyen:**

- Var olmayan bir eksiği «eksik» diye bildirmek. Paketteki modül
  yüzeylerinde adı geçen bir şey **vardır**; emin değilsen «şunu
  göremedim» yaz, «yok» yazma.
- Genel yazılım tavsiyesi (test yazın, tip ekleyin, CI kurun…).
  Bu depoda 2 618 test ve on denetim aracı var; sayılar §4'te.
- Bir çerçeve/kütüphane önerisi. Üç arayüzün **sıfır çalışma zamanı
  bağımlılığı** bilinçli bir karardır (HKM'de yalnız Python stdlib).

**Cevap biçimi:** her bulgu için `dosya:satır · ne yanlış · hangi girdide ·
nasıl doğrulanır` dörtlüsü. Doğrulanamayan bir bulgu, bulgu değil izlenimdir.

