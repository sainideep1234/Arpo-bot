---
## Questuions Sample 
1. I just finished Tritiya Sopan. What exactly is left for Rajya Puraskar?
2. Rajya puraskar ke liye camping requirements kya hain?
3. How does one become a Rashtrapati Scout/Guide?
4. How many camping nights are required for these top awards?
5. How can an adult leader become a Himalaya Wood Badge (HWB) holder?
---

## v1 PROPOSAL

1. The "Dispute Settler" (Citation Engine) The Pain:
   A Scout Master claims, "You need 5 nights of camping for Rajya Puraskar." The student thinks it's 3.

   The Feature: The bot must answer: "The requirement is 3 nights. (Source: APRO Part II, Page 45, Clause 14)."

   Tech: Metadata filtering in your Vector DB.

2. "Visual Badge Identity" (The Alpha Feature)

   The Pain: A student finds an old patch in the cupboard. "What is this badge?"

   The Feature: User uploads a photo of the badge -> Bot identifies it -> Bot pulls the specific requirements to earn it.

   Tech: This uses the Vision capabilities of your LLM (e.g., GPT-4o or Gemini 1.5 Flash).

3. The "Syllabus Tracker"
   The Pain: The syllabus is confusing. "I just finished Tritiya Sopan. What exactly is left for Rajya Puraskar?"

   The Feature: A strictly ordered checklist generated from the APRO PDFs.

4. Hinglish Support

   The Pain: Most Scouting happens in Hindi/Regional languages, but the rulebooks are dense English.

   The Feature: Allow users to ask in Hinglish ("Rajya puraskar ke liye camping requirements kya hain?") and get a structured English/Hindi response.

--

## v1 functionality

- no R2(object store is used ) instead multer si used to upload photos directly to server and delete after some time .

## v2 proposal

- create a pattern/class object oriented programing to btter arra nge my code .
- can need to update your code .
- create a endpoint to create new thread.
- create user signin and signup



---