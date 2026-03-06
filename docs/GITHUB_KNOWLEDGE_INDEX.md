# KJELDGAARD AI KNOWLEDGE BASE INDEX
Version: 1.1

Location: docs/GITHUB_KNOWLEDGE_INDEX.md  
Repository: Kjeldgaards/adfactory  

This file is the central navigation index for the shared AI knowledge base used across KJELDGAARD AI systems.

It tells AI systems:

• which documents exist  
• what each document contains  
• when each document should be used  

All AI systems must consult this file before retrieving documentation.

------------------------------------------------------------

# DOCUMENT ACCESS

All referenced files are stored in:

Repository: Kjeldgaards/adfactory  
Folder: docs/

Railway exposes them through the API:

https://adfactory-production.up.railway.app/api/docs/{filename}

Claude Projects retrieve these files using `web_fetch`.

IMPORTANT: All files in this index are listed with their full retrieval URLs. AI systems must use these exact URLs when fetching documents.

------------------------------------------------------------

# CORE PRODUCT KNOWLEDGE

Primary product documentation used by all AI systems.

File:

https://adfactory-production.up.railway.app/api/docs/CORE_SALES_PITCH_KJELDGAARD_COMPLETE.md

Contains:

• target audience  
• product positioning  
• pain points  
• root cause explanation  
• mechanism  
• benefits  
• proof  
• testimonials  
• objections  

This is the primary product reference document.

------------------------------------------------------------

# COMPLIANCE & CLAIM VALIDATION

Used for verifying marketing claims.

Files:

https://adfactory-production.up.railway.app/api/docs/FACTS_KJELDGAARD_INGREDIENTS_FINAL_v9.txt  
https://adfactory-production.up.railway.app/api/docs/FACTS_KJELDGAARD_SAFETY_FINAL_v10.txt  
https://adfactory-production.up.railway.app/api/docs/FACTS_KJELDGAARD_EFFICACY_FINAL_v10.txt  

These documents define:

• allowed ingredient claims  
• safety claims  
• clinical claims  
• prohibited claims  

AI systems must only generate claims supported in these files.

------------------------------------------------------------

# LANGUAGE & TONE SYSTEM

Defines the KJELDGAARD brand voice and Danish language rules.

Files:

https://adfactory-production.up.railway.app/api/docs/ORDBANK_ENGELSK_TIL_DANSK_HUDPLEJESPROG.txt  
https://adfactory-production.up.railway.app/api/docs/SAETNINGSPAR_AI_DANSK_VS_NATURLIGT_DANSK.txt  
https://adfactory-production.up.railway.app/api/docs/ORDBANK_VOICE_OF_CUSTOMER_v4.txt  

Purpose:

• convert English marketing language into natural Danish  
• eliminate "AI Danish" phrasing  
• maintain authentic customer language  

These files define tone, vocabulary, and linguistic style.

------------------------------------------------------------

# COPYWRITING FRAMEWORKS

Used for persuasion analysis and script optimization.

Files:

https://adfactory-production.up.railway.app/api/docs/Breakthrough-Advertising-by-Eugene-M-Schwartz_-_FInal.txt  
https://adfactory-production.up.railway.app/api/docs/jon-benson-copychief-master-system_v3.md  
https://adfactory-production.up.railway.app/api/docs/KJELDGAARD_MASTER_INSTRUCTIONS_v1.md  

These frameworks define:

• persuasion structure  
• script optimization systems  
• operational rules for KJELDGAARD marketing

------------------------------------------------------------

# SWIPE FILE LIBRARY

Reusable copy patterns from successful campaigns.

Files:

https://adfactory-production.up.railway.app/api/docs/SWIPE_KJELDGAARD_HOOKS_BEST.txt  
https://adfactory-production.up.railway.app/api/docs/SWIPE_KJELDGAARD_MECHANISMS_BEST.txt  
https://adfactory-production.up.railway.app/api/docs/SWIPE_KJELDGAARD_INTEREST_PROBLEM_DESIRE_BEST.txt  
https://adfactory-production.up.railway.app/api/docs/SWIPE_KJELDGAARD_BENEFITS_BEST.txt  
https://adfactory-production.up.railway.app/api/docs/SWIPE_KJELDGAARD_CTA_SOCIALPROOF_BEST.txt  
https://adfactory-production.up.railway.app/api/docs/SWIPE_KJELDGAARD_GOLDEN_STANDARD_ADVERTORIALS.txt  
https://adfactory-production.up.railway.app/api/docs/SWIPE_TP_KJELDGAARD_TESTIMONIALS_03_01_26.txt  
https://adfactory-production.up.railway.app/api/docs/SWIPE_KJELDGAARD_DO_txt_UPDATED.txt  
https://adfactory-production.up.railway.app/api/docs/SWIPE_KJELDGAARD_DON_T_UPDATED.txt  

These files provide:

• high-performing hooks  
• mechanism explanations  
• problem and agitation phrasing  
• benefit language  
• CTA structures  
• testimonials  
• approved phrasing patterns  
• forbidden phrasing patterns

------------------------------------------------------------

# MIGRATION SYSTEM

Used for adapting successful marketing structures from other industries.

File:

https://adfactory-production.up.railway.app/api/docs/ORSHOT_MIGRATION_FREELANCER_GUIDE.md

This file explains how persuasion structures from other niches can be adapted to KJELDGAARD skincare marketing.

------------------------------------------------------------

# GENERAL DOCUMENTATION

File:

https://adfactory-production.up.railway.app/api/docs/README.md

Provides general repository information.

------------------------------------------------------------

# HOW AI SYSTEMS SHOULD USE THIS INDEX

When an AI system receives a task, it must first identify the task type.

Examples:

translation  
copywriting  
advertorial writing  
persuasion analysis  
migration  

The system should then retrieve the relevant documents.

Examples:

Translation tasks  
→ language files + compliance files + core product pitch

Copywriting tasks  
→ frameworks + swipe files + voice of customer

Advertorial tasks  
→ advertorial swipe + frameworks + core pitch

All claims must always be validated against the FACTS files.

Language files must always be used to ensure natural Danish tone.

------------------------------------------------------------

# IMPORTANT RULE

Shared knowledge must always be retrieved from GitHub via the Railway API.

Project-specific instructions must only exist inside the project that uses them.

This ensures:

• consistent knowledge across all AI systems  
• a single source of truth  
• automatic updates across projects

------------------------------------------------------------

End of file
