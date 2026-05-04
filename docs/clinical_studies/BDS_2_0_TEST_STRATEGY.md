# BDS 2.0 — Effektivitetstest Strategi & Gap Analyse

**Formål:** Specifik strategi-fil til planlægning af efficacy tests for Barrier Defense Serum 2.0
**Baseret på:** Eksisterende BDS 1.0 testdata (se INDEX_CLINICAL_STUDIES.md)
**Sidst opdateret:** 4. maj 2026

---

## DEN KRITISKE INDSIGT FRA BDS 1.0

Produktet hedder "Barrier Defense" men:

> **TEWL-målingen (skin barrier function) viser INGEN statistisk signifikant forbedring af hudbarrieren.**
>
> - Efter 4 timer: TEWL +11% (FORVÆRRELSE, p=0.04, signifikant)
> - Efter 14 dage: TEWL +12% (forværrelse, IKKE signifikant, p=0.09)
> - Efter 28 dage: TEWL -8% (lille forbedring, IKKE signifikant, p=0.30)

Det betyder vores brandnavn ikke er klinisk underbygget. Det skal fixes i 2.0.

---

## TIER 1 — MUST-HAVE TESTS FOR BDS 2.0

### Test #1: Tewameter (TEWL) — gentagelse efter formel-ændring
**Hvorfor:** Vores brandnavn KRÆVER dette claim. BDS 1.0 fejlede pga. utilstrækkelig formel.
**Endpoint:** "Klinisk dokumenteret styrkelse af hudbarrieren med X% efter X uger"
**Forbedring nødvendigt:** Tilføj Ceramide-kompleks + højere Niacinamid (4-5%)
**Estimeret pris:** 80-120K DKK (som del af kombineret studie)
**Risiko:** Hvis vi gentager uden formel-ændring, fejler det igen.

### Test #2: Corneometer (instrumentel hudfugt)
**Hvorfor:** Erstatter den svage subjektive "81% oplevede 24t fugt" med hard number
**Endpoint:** "Øger hudens fugt med X% efter X uger"
**Pris:** 60-100K DKK som add-on

### Test #3: Cutometer (fasthed/elasticitet)
**Hvorfor:** Sagging er primær trigger for målgruppen 55+ (større end fine linjer)
**Endpoint:** "Forbedrer hudens fasthed med X% efter X uger"
**Forudsætning:** Hæv peptid-koncentration (ARGIRELINE + Matrixyl Synthe'6)
**Pris:** 80-120K DKK som add-on

---

## TIER 2 — NICE-TO-HAVE

### Test #4: Mexameter (pigmentering)
**Endpoint:** "Reducerer mørke pletter med X%"
**Forudsætning:** Niacinamid 4-5% + behold Bakuchiol

### Test #5: Visioscan / PRIMOS topografi (overflade-glathed)
**Endpoint:** "Glattere hudtekstur med X%"
**Note:** PRIMOS-CR® er allerede brugt til rynker — kan udvides til topografi

### Test #6: Forlænget studieperiode (8 eller 12 uger i stedet for 4)
**Endpoint:** "X% rapporterede forbedring efter 12 ugers brug"
**Stærkere tidshorisont:** Matcher 60-dages garantien
**Pris:** Marginal ekstra omkostning hvis tilføjet i samme studie

---

## TIER 3 — KAN VENTE

### Test #7: In vivo kollagen-måling (ultralyd eller biopsi)
**Pris:** 350-500K DKK
**Bemærkning:** Kun nødvendigt hvis vi vil sige "stimulerer kollagen" lovligt — se DON'T-fil og kollagen-cheat-sheet. Anbefaling: SKIP. Brug ingrediens-niveau peptid-claims i stedet.

---

## OPTIMAL STUDIE-DESIGN

I stedet for at lave 5 separate studier — kombinér alt i ÉT:

**Foreslået BDS 2.0 efficacy studie:**
- **Lab:** COMPLIFE Italia eller Zurko Research (begge har alle instrumenterne)
- **Deltagere:** 35-50 kvinder, 40-65 år (tæt på real målgruppe)
- **Periode:** 8 uger, 2x daglig brug
- **Målepunkter:** Baseline, uge 4, uge 8
- **Endpoints:**
  - PRIMOS-CR® (rynker — gentag for konsistens med 1.0)
  - Tewameter® TM 300 (TEWL — fix det fejlede 1.0 claim)
  - Corneometer® CM 825 (hudfugt — nyt)
  - Cutometer® dual MPA 580 (fasthed — nyt)
  - Mexameter® MX 18 (pigmentering — nyt)
  - Spørgeskema (subjektiv evaluering)
  - Patch test (tolerance, dermatologisk overvåget)
- **Statistik:** LMM + Wilcoxon signed-rank, p<0.05
- **Samlet pris:** ~400-600K DKK (vs. 800K-1M for separate studier)

---

## FORMEL-ÆNDRINGER NØDVENDIGE FOR AT HITTE ENDPOINTS

### Skal ind / op:
1. **Ceramide-kompleks** (NP, AP, AS, NS, EOP) — for at hitte TEWL-endpoint
2. **Niacinamid 4-5%** — for TEWL + pigmentering (Mexameter)
3. **Højere peptid-koncentration** (ARGIRELINE + Matrixyl Synthe'6) — for Cutometer
4. **Beta-Glucan** (overvejes) — backup TEWL-styrke

### Beholder uændret:
- Encapsulated retinol (ROVISOME® Retinol Moist) — leverede 27% rynkereduktion, det er kernen
- 4D Hyaluronsyre-kompleks (Hymagic™-4D)
- Ferulic Acid + Vitamin E (antioxidant-stack)
- Squalane
- Bisabolol (komfort)
- Bakuchiol (Sytenol® A) — backup retinol-effekt

### Trim eller fjern:
- Tjek INCI for ingredienser uden aktiv claim-rolle for at gøre plads til premium tilføjelser uden voldsom prisstigning

---

## BESLUTNINGSPUNKTER FØR TEST-BESTILLING

Skal afklares med S&J inden test bestilles:
1. Max peptid-koncentration uden destabilisering (har stabilitetstest 12W ved nuværende formel)
2. Ceramide-kompleks tilføjelse — hvilken leverandør, hvilken dosering, kompatibilitet med eksisterende formel?
3. Niacinamid op til 4-5% — pH-konsekvens, kompatibilitet med Carbomer-systemet?
4. Forny GMP-certifikat (udløb november 2023, kritisk for EU-marked)
5. Pris-konsekvens af alle ovenstående ændringer

---

## NÆSTE HANDLINGER (Rækkefølge)

1. **Mail til S&J** med formel-ændringsforespørgsler (Khun Natcha)
2. **Få revideret formel + ny stabilitetstest 12W**
3. **Få ny PET (Challenge Test) på revideret formel**
4. **RFQ til COMPLIFE og Zurko** for kombineret 8-ugers efficacy studie
5. **Vælg lab, bestil studie**
6. **Modtag resultater (~4 måneder fra studie-start)**
7. **Opdater FACTS_KJELDGAARD_EFFICACY til v11** med nye claims
8. **Opdater ORDBANK + SWIPE-filer** med nye claim-formuleringer
9. **Lance BDS 2.0** med ny copy

**Estimeret total tid:** 6-9 måneder fra formel-godkendelse til lancering

---

## REFERENCEDATA TIL SAMMENLIGNING (BDS 1.0)

Når BDS 2.0-resultater kommer ind, sammenlign mod:

| Metric | BDS 1.0 resultat | BDS 2.0 mål |
|---|---|---|
| Rynker (D28) | -27% (sig.) | ≥-27% (matche eller bedre) |
| TEWL (D28) | -8% (ikke sig.) | ≥-15% statistisk signifikant |
| Hudfugt | 81% subjektiv | +X% Corneometer (instrumentel) |
| Fasthed | Ikke målt | +X% Cutometer (nyt claim) |
| Pigmentering | 52% subjektiv | -X% Mexameter (nyt claim) |
| Tilfredshed (D28) | 100% | Match eller bedre |

