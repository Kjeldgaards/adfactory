# KJELDGAARD Barrier Defense Serum — Clinical Studies & Test Documentation Index

**Product:** KJELDGAARD Barrier Defense® Serum
**Formulation No.:** SBW006-05 (also referred to as 30029356, project USHC0822-101)
**Manufacturer:** S&J International Enterprises Public Co., Ltd. (Sriracha, Thailand)
**Last updated:** 4. maj 2026

---

## OVERSIGT — ALLE STUDIER PÅ FÆRDIGT PRODUKT (BDS 1.0, formel SBW006-05)

| # | Studie | Lab | Type | Filnavn på GitHub |
|---|---|---|---|---|
| 1 | 28-dages klinisk efficacy | Zurko Research (ES) | In vivo, n=21 | `ZURKO_efficacy_28d_VV_ET-16-20DXT3_BDS_v3.pdf` |
| 2 | Patch test (96 timer okklusiv) | Zurko Research (ES) | In vivo, n=32 | `ZURKO_patch_test_96h_VV_CC-PT-30D3T1_BDS_v4.pdf` |
| 3 | Blue Light & Antioxidant | COMPLIFE Italia | In vitro keratinocytes | `COMPLIFE_blue_light_antioxidant_invitro_BDS_IT0005666-22.pdf` |
| 4 | Cell Proliferation | COMPLIFE Italia | In vitro keratinocytes | `COMPLIFE_cell_proliferation_invitro_BDS_IT0005665-22.pdf` |
| 5 | Stability Test 12 uger | S&J International | Intern | `SJ_stability_test_12W_BDS_30029356.pdf` |
| 6 | Preservative Efficacy Test (PET) | S&J International | ISO 11930:2019 | `SJ_PET_challenge_test_BDS_30029356.pdf` |
| 7 | GMP-certifikat | Thai FDA | Compliance | `SJ_GMP_certificate_Sriracha_plant.pdf` |

Plus 23 ingrediens-TDS'er i `raw_pdfs/ingredient_tds/`.

---

## 1. ZURKO Research — Klinisk Efficacy & Tolerance Studie (28 dage)

**Fil:** `raw_pdfs/ZURKO_efficacy_28d_VV_ET-16-20DXT3_BDS_v3.pdf`
**Lab:** Zurko Research S.L., Madrid, Spanien (EU-akkrediteret)
**Studie-ID:** VV_ET-16/20DXT3(D)-A_723_22_001 + VV_ET-2/20DXT4(S)-B_723_22_001
**Periode:** 16. sept. – 19. okt. 2022 (28 dage)
**Rapport-version:** v3 (18. nov. 2022)

### Design
- 23 deltagere enrolleret, 21 fuldførte (alder 30-70, kvinder + mænd, alle hudtyper inkl. sensitiv)
- 2x daglig anvendelse på ansigt
- Målepunkter: D0 (baseline), D0+4t, D14, D28
- Statistik: Linear Mixed-Effects Model + Wilcoxon Signed-Rank Test, p<0.05

### Instrumenter
- **PRIMOS-CR®** — 3D billedanalyse af fine linjer/rynker (kragetæer)
- **Tewameter® TM 300** — Transepidermalt vandtab (TEWL) på pande
- Spørgeskema (subjektiv evaluering)
- Dermatologisk evaluering ved Javier Pedraz Muñoz (medical license 283706434)

### Resultater — Instrumentel efficacy

| Parameter | Tidspunkt | Resultat | p-værdi | Signifikans |
|---|---|---|---|---|
| Rynker (PRIMOS-CR Ra) | D14 | -18% | 1.56E-03 | **Signifikant ✓** |
| Rynker (PRIMOS-CR Ra) | D28 | -27% | 6.41E-05 | **Signifikant ✓** |
| TEWL (Tewameter) | D0+4t | +11% (øget) | 0.04 | **Signifikant** ⚠ |
| TEWL (Tewameter) | D14 | +12% (øget) | 0.09 | Ikke signifikant |
| TEWL (Tewameter) | D28 | -8% (forbedret) | 0.30 | Ikke signifikant |

- 81% af deltagere så forbedring i rynker efter 14 dage
- 100% af deltagere så forbedring i rynker efter 28 dage

### Resultater — Subjektiv evaluering (n=21, efter 28 dage)
- 100% tilfredse med resultatet på huden
- 100% fik opfyldt forventninger
- 100% oplevede næret hud
- 95% oplevede mere fugtet hud
- 90% oplevede glødende hud
- 90% oplevede blødere hud
- 90% oplevede produktet som ikke-irriterende
- 86% tilfredse med teksturen
- 81% oplevede 24-timers fugtgivning
- 81% oplevede forbedret hudtekstur
- 76% oplevede glattere hud
- 71% oplevede ikke-fedtet følelse
- 62% oplevede komfortabel duft
- 52% oplevede forbedret pigmentering
- 48% oplevede at fine linjer/rynker var mindre synlige

**Købsintention:** 24% "ja sikkert", 62% "sandsynligvis ja", 10% ved ikke, 5% sandsynligvis ikke.

### Resultater — Dermatologisk tolerance
- 0% af deltagere viste hudpåvirkninger (desquamation, tørhed, akne, rødme, pletter, ødem, vesikler)
- 100% af deltagere rapporterede ingen uønskede effekter

### ⚠ KRITISK OBSERVATION (relevant for BDS 2.0)
TEWL-resultaterne viser **statistisk signifikant FORVÆRRELSE efter 4 timer** (+11%) og **ikke statistisk signifikant** ved D14 og D28. Dette er paradoxalt for et produkt der hedder "Barrier Defense" — vi har ingen klinisk dokumenteret langtidsforbedring af hudbarrieren. Dette skal adresseres i BDS 2.0 reformulering.

---

## 2. ZURKO Research — Patch Test (96 timer okklusiv)

**Fil:** `raw_pdfs/ZURKO_patch_test_96h_VV_CC-PT-30D3T1_BDS_v4.pdf`
**Lab:** Zurko Research S.L., Madrid, Spanien (EU-akkrediteret)
**Studie-ID:** VV_CC-PT/30D3T1(D)1_723_22_001
**Periode:** 29. august – 2. september 2022 (5 dage / 96 timer okklusiv)
**Rapport-version:** v4 (20. september 2022)

### Design
- 33 deltagere enrolleret, 32 fuldførte (V01 ekskluderet som positiv kontrol)
- Alder: 18-70 år, alle hudtyper (sensitiv + ikke-sensitiv), Fitzpatrick I-IV
- Test-område: Øvre ryg
- Applikation: 20 µl produkt under Finn Chamber Aqua® okklusiv patch, ÉN gang
- Evaluering: 15-30 min efter patch-fjernelse, klinisk + dermatologisk

### Resultater

| Parameter | Værdi | Klassifikation |
|---|---|---|
| **M.I.I. (Mean Irritation Index)** | **0,016** | Non-Irritating (NI) / Good Cutaneous Compatibility |
| Reaktive panelister | 1 af 32 | 3% |
| Erythema score 1 (let) | V18 (mand, 19, sensitiv hud, Fitzpatrick IV) | — |
| Edema | 0 hos alle | — |

**Klassifikationsskala:**
- M.I.I. = 0,000 → Very Good Cutaneous Compatibility
- M.I.I. < 0,200 → **Non-Irritating / Good Cutaneous Compatibility** ← BDS resultat
- 0,200 ≤ M.I.I. < 0,500 → Slightly Irritating
- 0,500 ≤ M.I.I. < 1,000 → Moderately Irritating
- M.I.I. ≥ 1,000 → Irritating

### Konklusion (verbatim fra rapport)
> "Under adopted experimental conditions, the product KJELDGAARD BARRIER DEFENSE, reference: FORMULATION NO.SBW006-05 is Non irritating (NI). In conclusion, it has Good cutaneous compatibility."

### Note om de 97% / 3% claims
- 97% (31 af 32) viste INGEN reaktion
- 3% (1 af 32) viste meget let erythema (score 1, M.I.I. = 0,031 for den daglige måling, total M.I.I. = 0,016 forbliver under irritation-grænsen)
- Produktet **forbliver klassificeret som "Non-Irritating"** trods denne ene reaktion — M.I.I. 0,016 er langt under irritationsgrænsen på 0,200

---

## 3. COMPLIFE Italia — Blue Light & Antioxidant Studie (in vitro)

**Fil:** `raw_pdfs/COMPLIFE_blue_light_antioxidant_invitro_BDS_IT0005666-22.pdf`
**Lab:** COMPLIFE Italia S.r.l., San Martino Siccomario (PV), Italien
**Akkreditering:** ACCREDIA LAB N 1318L (UNI CEI EN ISO/IEC 17025:2018)
**Record No.:** V.E.VT.TR.NBL00.100.00.00_IT0005666/22
**Eksperimentel periode:** 29. november – 2. december 2022
**Biokemiske analyser:** 6. december 2022
**Rapportdato:** 23. december 2022 (Rev. 00, Draft)

**Personale:**
- Experimenter: Dott. Andrea Poggi (Biolog)
- Study Director: Dott.ssa Silvana Giardina (Biolog)

### Design
- **Cellemodel:** Human keratinocyt-cellekultur
- **Testkoncentrationer:** 0,1%, 0,05%, 0,025% (valgt efter foreløbig cytotoxicitetstest)
- **Eksponering:** 2 cyklusser dag/nat med 8 timers blåt lys hver (LED-lyssystem)
- **Kontroller:**
  - CTR-: Ubehandlede celler
  - CTR+: Celler eksponeret for blåt lys uden behandling
- **Statistik:** Student's t-test, p<0.05

### Metoder
- **MTT assay** — Cellelevedygtighed (3-(4,5-dimethylthiazol-2)-2,5-diphenyltetrazolium bromide reduktion → blå/lilla formazan-krystaller, måles ved 570 nm)
- **MDA dosage** — Lipidperoxidation (Malondialdehyd-måling med NMPI kromogen ved 586 nm — Erdelmeier metode 1998)

### Resultater — Cell Viability (beskyttelse mod blåt lys)

| Behandling | Mean viability | St. dev. | Protection % vs CTR+ |
|---|---|---|---|
| CTR- (ingen blåt lys) | 100% | — | — |
| CTR+ (blåt lys, ubehandlet) | 62,1% | 4,8% | — |
| BDS 0,1% | 81,7% | 2,5% | **+19,5% *** |
| BDS 0,05% | 87,5% | 6,2% | **+25,4% *** |
| BDS 0,025% | 102,4% | 9,5% | **+40,2% *** |

\* p<0.05 (statistisk signifikant)

### Resultater — Lipoperoxidation (MDA-niveau, oxidativ stress)

| Behandling | MDA Mean (µM) | St. dev. | VAR% vs CTR- | Protection % vs CTR+ |
|---|---|---|---|---|
| CTR- | 0,659 | 0,0836 | — | — |
| CTR+ | 1,039 | 0,039 | +57,7% | — |
| BDS 0,1% | 0,711 | 0,026 | +7,9% | **+49,7% *** |
| BDS 0,05% | 0,719 | 0,027 | +9,2% | **+48,5% *** |
| BDS 0,025% | 0,821 | 0,080 | +24,7% | **+33,0% *** |

\* p<0.05 (statistisk signifikant)

### Konklusion (verbatim fra rapport)
> "KJELDGAARD BARRIER DEFENSE SBW006-05 showed a significant protective capability against stress induced by blue light irradiation, highlighting antioxidant efficacy and blue light protection."

### Note om koncentrationer
Bemærk at **0,025% (laveste koncentration) gav den HØJESTE beskyttelse**: 40,2% cellelevedygtighed og 33,0% oxidativ stress-reduktion. Ved 0,1% (højeste) var beskyttelsen mod oxidativt stress størst (49,7%). Dette kan skyldes hormesis-effekt eller opløsningsegenskaber i cellekultur.

---

## 4. COMPLIFE Italia — Cell Proliferation Studie (in vitro)

**Fil:** `raw_pdfs/COMPLIFE_cell_proliferation_invitro_BDS_IT0005665-22.pdf`
**Lab:** COMPLIFE Italia S.r.l., San Martino Siccomario (PV), Italien
**Akkreditering:** ACCREDIA LAB N 1318L (UNI CEI EN ISO/IEC 17025:2018)
**Record No.:** V.E.VT.CE.NCM00.000.00.00_IT0005665/22
**Cell seeding:** 28. november 2022
**Eksperimentel periode:** 30. november – 2. december 2022
**Dataanalyse:** 16. december 2022
**Rapportdato:** 22. december 2022 (Rev. 00, Draft)

**Personale:**
- Experimenter: Dott. Andrea Poggi (Biolog)
- Study Director: Dott.ssa Silvana Giardina (Biolog)

### Design
- **Cellemodel:** Human keratinocyt-cellekultur (G0-fase)
- **Testkoncentrationer:** 0,1%, 0,05%, 0,025% (valgt efter foreløbig cytotoxicitetstest)
- **Tidspunkter:** 24, 48 og 72 timer
- **Kontrol:** CTR- (ubehandlede celler) = 100% levedygtighed
- **Statistik:** Student's t-test, p<0.05

### Metode
- Celler såes i 96-brønd plade med ufuldstændigt medium (uden kvægfoster-serum) → induktion af cellulær G0-fase
- Efter 24 timer tilføjes komplet medium med produkt → genstart fra G0
- MTT assay efter 24/48/72 timer

### Resultater — 24 timer

| Koncentration | Cell Viability mean | St. dev. | Cell Proliferation (vs CTR-) |
|---|---|---|---|
| BDS 0,1% | 112,1% | 0,3% | **+12,1% *** |
| BDS 0,05% | 130,4% | 10,7% | **+30,4% *** |
| BDS 0,025% | 141,0% | 12,9% | **+41,0% *** |

### Resultater — 48 timer

| Koncentration | Cell Viability mean | St. dev. | Cell Proliferation (vs CTR-) |
|---|---|---|---|
| BDS 0,1% | 109,0% | 1,9% | +9,0% (ikke signifikant) |
| BDS 0,05% | 120,4% | 0,7% | **+20,4% *** |
| BDS 0,025% | 153,9% | 4,4% | **+53,9% *** |

### Resultater — 72 timer

| Koncentration | Cell Viability mean | St. dev. | Cell Proliferation (vs CTR-) |
|---|---|---|---|
| BDS 0,1% | 108,4% | 2,3% | +8,4% (ikke signifikant) |
| BDS 0,05% | 110,2% | 0,7% | +10,2% (ikke signifikant) |
| BDS 0,025% | 111,6% | 11,2% | +11,6% (ikke signifikant) |

\* p<0.05 (statistisk signifikant)

### Konklusion (verbatim fra rapport)
> "KJELDGAARD BARRIER DEFENSE SBW006-05 significantly enhances proliferation capability of cell culture in the specific in vitro model, highlighting a potential in the acceleration of skin renewal on a cellular level."

### Note om bedste koncentration
**0,025% leverede konsistent den højeste celleproliferation** ved alle tidspunkter (41,0% efter 24t, 53,9% efter 48t). Effekten aftager efter 72 timer (kun 11,6%), hvilket indikerer at proliferationsboost er størst i de første 48 timer.

---

## 5. S&J — Stabilitetstest 12 uger

**Fil:** `raw_pdfs/SJ_stability_test_12W_BDS_30029356.pdf`
**Lab:** S&J International Enterprises (intern)
**Periode:** 17. august – 9. november 2022
**Protocol:** S&J MASTER TYPE C
**Konklusion:** ✓ **PASSED** — 12 ugers stabilitet bekræftet

### Testbetingelser

| Forhold | Periode |
|---|---|
| 4°C | 12 uger |
| Stuetemperatur | 12 uger |
| 40°C | 12 uger |
| 50°C | 4 uger |
| Solar box | 4 timer |
| -10°C / 40°C cyklusser | 6 cyklusser |

### Observerede ændringer (ikke kritiske)
- **Tekstur ved RT:** Lette hvide striber på flaskens side ved 4-12 uger
- **Farve:** Bliver let mere gul og mat over tid (især ved høj temperatur)
- **Lugt:** Bliver let stærkere base-duft over tid
- **pH:** Stabil ved 5.7-5.8 gennem hele perioden
- **Viskositet:** Stabil 2.850-3.179 cP

**Konklusion:** Formuleringen er stabil over 12 uger ved almindelige forhold. Acceptabel anbefalet holdbarhed.

---

## 6. S&J — Preservative Efficacy Test (PET / Challenge Test)

**Fil:** `raw_pdfs/SJ_PET_challenge_test_BDS_30029356.pdf`
**Lab:** S&J International Enterprises (ISO/IEC 17025-akkrediteret, Accreditation No. 1023/47)
**Periode:** 18. august – 15. september 2022
**Metode:** ISO 11930:2019
**Konklusion:** ✓ **PASSED**

### Testede mikroorganismer

| Mikroorganisme | Initial inoculum | 28-dages log reduktion | Krav |
|---|---|---|---|
| S. aureus (ATCC 6538) | 1.3 × 10⁶ CFU/g | 6.1 (>3 indenfor 7 dage ✓) | Bakterie ≥3 |
| E. coli (ATCC 8739) | 1.1 × 10⁶ CFU/g | 6.0 ✓ | Bakterie ≥3 |
| P. aeruginosa (ATCC 9027) | 1.0 × 10⁶ CFU/g | 6.0 ✓ | Bakterie ≥3 |
| C. albicans (ATCC 10231) | 1.2 × 10⁵ CFU/g | 5.1 ✓ | Gær ≥1 |
| A. brasiliensis (ATCC 16404) | 8.4 × 10⁴ CFU/g | 4.9 ✓ | Skimmel ≥1 efter 28d |

**Konklusion:** Konserveringssystemet (Phenoxyethanol + Ethylhexylglycerin) er fuldt effektivt mod alle testede mikroorganismer.

---

## 7. GMP-Certifikat

**Fil:** `raw_pdfs/SJ_GMP_certificate_Sriracha_plant.pdf`
**Udsteder:** Thai Food and Drug Administration (FDA Thailand), Bureau of Cosmetics and Hazardous Substances Control
**Ref. nr.:** 1-5-04-17-20-0100
**Udstedelsesdato:** 2. november 2020
**Gyldig til:** 1. november 2023
**Status:** ⚠ **UDLØBET** — kræver fornyelse for fortsat compliance

**Anlæg:** S&J International Enterprises Public Co., Ltd., 600/4 Moo 11, Sukhapiban 8 Rd, Nongkharm, Sriracha, Chonburi 20230, Thailand

**HANDLING NØDVENDIG:** Bekræft med S&J at de har fornyet GMP-certifikatet for perioden efter november 2023.

---

## 8. INGREDIENS-DOKUMENTATION (Leverandør-TDS'er)

Alle 23 ingrediens-TDS'er ligger i `raw_pdfs/ingredient_tds/`. Navngivet som `{materialnummer}_{ingrediensnavn}_{kilde}_TDS.pdf`.

### Aktive ingredienser

| Material # | Ingrediens (handelsnavn) | INCI | Leverandør |
|---|---|---|---|
| 10005023 | ARGIRELINE® | Acetyl Hexapeptide-8 | Lipotec |
| 10005861 | Matrixyl Synthe'6® | Palmitoyl Tripeptide-38 | Sederma |
| 10006802 | Sytenol® A | Bakuchiol | Sytheon |
| 10007874 | ROVISOME® Retinol Moist | Encapsulated Retinol | Rahn AG |
| 10006889 | Soliberine® | Buddleja Officinalis Flower Extract (Verbascoside + Echinacoside) | Greentech |
| 10006657 | Hymagic™-4D | 4D Hyaluronic Acid Complex | Bloomage Freda Biopharm |
| 10002141 | Promois® WU-32R | Hydrolyzed Collagen | Seiwa Kasei |
| 10007623 | Ferulic Acid | Ferulic Acid | Hangzhou Rebtech |
| 10002244 | Vitamin E Acetate | Tocopheryl Acetate | BASF |
| 10007441 | Squalane | Squalane | Shaanxi Haibo |
| 10000275 | Bisabolol rac. | Bisabolol | BASF |

### Fugtgivende / humectants

| Material # | Ingrediens | INCI | Leverandør |
|---|---|---|---|
| 10000051 | Glucam™ E-20 | Methyl Gluceth-20 | Lubrizol |
| 10007223 | Liponic® EG-1 | Glycereth-26 | Vantage |
| 10003378 | Zemea® | Propanediol | DuPont/Tate & Lyle |
| 10000342 | 1,3-Butylene Glycol | Butylene Glycol | OXEA |
| 10004720 | Polyglykol 400 | PEG-8 | Clariant |

### Konservering & multifunktional

| Material # | Ingrediens | INCI | Leverandør |
|---|---|---|---|
| 10004523 | Phenoxyethanol P5 | Phenoxyethanol | Galaxy Surfactants |
| 10002883 | Sensiva™ SC 50 | Ethylhexylglycerin | Schülke |

### Tekstur & stabilisering

| Material # | Ingrediens | INCI | Leverandør |
|---|---|---|---|
| 10005718 | Carbopol® Ultrez 30 | Carbomer | Lubrizol |
| 10000596 | Rhodicare® S | Xanthan Gum | PMC Ouvrie |
| 10006561 | Tris Amino® Ultra PC | Tromethamine | ANGUS Chemical |
| 10006415 | Serasoft SW 75 | Bis-PEG-18 Methyl Ether Dimethyl Silane | Elementis |
| 10002936 | Natrlquest® E30 | Trisodium Ethylenediamine Disuccinate | Innospec |

---

## 9. RELATEREDE FILER PÅ GITHUB

- `docs/FACTS_KJELDGAARD_EFFICACY_FINAL_v10.txt` — Approved marketing claims fra Zurko + COMPLIFE
- `docs/FACTS_KJELDGAARD_SAFETY_FINAL_v10.txt` — Sikkerhedsclaims (PET + tolerance)
- `docs/FACTS_KJELDGAARD_INGREDIENTS_FINAL_v9.txt` — Ingrediens-niveau claims
- `docs/FACTS_KJELDGAARD_INCI_FULL_v2.txt` — Komplet INCI-liste
- `docs/CORE_SALES_PITCH_KJELDGAARD_COMPLETE.md` — Salgs-fundamentet baseret på testdata
- `docs/clinical_studies/BDS_2_0_TEST_STRATEGY.md` — Strategi for BDS 2.0 efficacy tests

---

## 10. GAP ANALYSE — HVAD MANGLER I TESTPORTEFØLJEN

### Mangler kliniske målinger på færdigt produkt:
- ✗ **Corneometer** (instrumentel hudfugt) — har kun subjektiv 81% / 95% rapport
- ✗ **Cutometer** (fasthed/elasticitet) — ingen data
- ✗ **Mexameter** (pigmentering/melanin) — ingen data, kun 52% subjektivt
- ✗ **Visioscan/PRIMOS topografi** (hudtekstur ud over rynker) — kun rynker målt
- ⚠ **Tewameter** — eksisterer men resultatet var IKKE signifikant langsigtet (kritisk gap for "Barrier Defense" brand)

### Mangler dokumenter/handlinger:
- ⚠ Forny GMP-certifikat (udløb november 2023)
- ⚠ Bekræft formel-version: Stability + PET refererer til "30029356" / "USHC0822-101", mens Zurko + COMPLIFE refererer til "SBW006-05" — bekræft at det er samme formel

### Anbefalinger til BDS 2.0:
1. **Reformuler for at adressere det fejlede TEWL-resultat** — tilføj Ceramide-kompleks + højere Niacinamid
2. **Bestil kombineret studie** med Tewameter + Corneometer + Cutometer + Mexameter på én gang (~400-600K DKK)
3. **Behold encapsulated retinol** — leverede 27% rynkereduktion (kernen)
4. **Hæv peptid-koncentration** (ARGIRELINE + Matrixyl Synthe'6) for at hitte fasthed-endpoint på Cutometer
5. **Bemærk in vitro-doseringseffekt:** COMPLIFE-data viser at LAVERE koncentrationer (0,025%) gav stærkere proliferation- og blue light-beskyttelse end højere — dette skal valideres ved formel-ændringer

---

## 11. FILER VEDRØRENDE BDS 2.0 (FREMTIDIGE TESTS)

*Tilføjes når BDS 2.0 efficacy tests er bestilt.*

Se `BDS_2_0_TEST_STRATEGY.md` for detaljeret testplan.
