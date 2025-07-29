// simulation-service/src/services/dialogue/culturalContext.js
class CulturalContextManager {
    constructor() {
      this.kenyanElements = {
        kiswahili: {
          common: {
            greetings: ["hujambo", "habari", "mambo", "hodi"],
            expressions: ["pole sana", "asante sana", "karibu", "haya", "sawa"],
            medical: ["maumivu", "homa", "tumbo", "kichwa", "mguu", "mkono"],
            family: ["mama", "baba", "mtoto", "bibi", "babu"],
            responses: ["ndiyo", "hapana", "sijui", "labda", "hivi karibuni"]
          },
          phrases: {
            pain: "nina maumivu",
            fever: "nina homa", 
            tired: "nimechoka",
            worry: "nina wasiwasi",
            thanks: "asante sana daktari",
            sorry: "pole sana"
          }
        },
        
        sheng: {
          common: ["poa", "sawa", "aje", "niaje", "zi", "doh"],
          expressions: ["mambo", "iko sawa", "poa sana", "haya basi"]
        },
  
        culturalPhrases: {
          family_involvement: [
            "my mother always says...",
            "the elders in our village told me...",
            "my grandmother used this traditional remedy...",
            "in our culture, we believe...",
            "my family is very worried about this"
          ],
          
          medical_approach: [
            "we tried traditional medicine first",
            "the local clinic said...",
            "my neighbor had something similar",
            "I went to the chemist but...",
            "the traditional healer recommended..."
          ],
          
          social_context: [
            "I work in the market and...",
            "I have to take matatu to come here",
            "my boss doesn't understand when I'm sick",
            "I can't afford to miss work",
            "my insurance doesn't cover everything"
          ],
  
          religious: [
            "if God wills it",
            "we are praying about this",
            "our pastor says...",
            "inshallah it will be okay",
            "we believe God will heal"
          ]
        },
  
        responsePatterns: {
          direct_answer: 0.3,    // Kenyan patients often less direct
          story_telling: 0.4,    // Prefer narrative explanations
          family_context: 0.5,   // Often mention family/community
          traditional_ref: 0.2   // Reference to traditional medicine
        }
      };
  
      this.educationLevels = {
        primary: {
          english_proficiency: "basic",
          medical_knowledge: "limited",
          communication_style: "simple_terms",
          kiswahili_mixing: 0.6
        },
        secondary: {
          english_proficiency: "intermediate", 
          medical_knowledge: "moderate",
          communication_style: "mixed_complexity",
          kiswahili_mixing: 0.3
        },
        tertiary: {
          english_proficiency: "advanced",
          medical_knowledge: "good",
          communication_style: "sophisticated",
          kiswahili_mixing: 0.1
        }
      };
  
      this.socioeconomicFactors = {
        rural: {
          characteristics: ["traditional_medicine_use", "extended_family_involvement", "transport_challenges"],
          speech_patterns: ["slower_pace", "more_formal", "respectful_address"],
          concerns: ["cost_of_treatment", "time_away_from_work", "family_responsibilities"]
        },
        urban_informal: {
          characteristics: ["mixed_languages", "street_smart", "modern_references"],
          speech_patterns: ["casual_mixing", "sheng_usage", "faster_pace"],
          concerns: ["job_security", "rent_money", "transport_costs"]
        },
        urban_formal: {
          characteristics: ["education_emphasis", "health_awareness", "insurance_coverage"],
          speech_patterns: ["proper_english", "medical_terminology", "direct_questions"],
          concerns: ["work_productivity", "quality_of_care", "time_efficiency"]
        }
      };
    }
  
    enhanceResponseWithCulture(baseResponse, patientProfile, emotionalState) {
      const culturalBackground = patientProfile.culturalBackground || 'kenyan_general';
      const education = patientProfile.education || 'secondary';
      const socioeconomic = patientProfile.socioeconomic || 'urban_informal';
      
      let enhancedResponse = baseResponse;
  
      // Add language mixing based on education level
      enhancedResponse = this.addLanguageMixing(enhancedResponse, education, emotionalState);
      
      // Add cultural references
      enhancedResponse = this.addCulturalReferences(enhancedResponse, socioeconomic);
      
      // Adjust communication style
      enhancedResponse = this.adjustCommunicationStyle(enhancedResponse, education, socioeconomic);
      
      return enhancedResponse;
    }
  
    addLanguageMixing(text, educationLevel, emotionalState) {
      const eduConfig = this.educationLevels[educationLevel] || this.educationLevels.secondary;
      
      // Higher emotional states = more native language
      let mixingRate = eduConfig.kiswahili_mixing;
      if (emotionalState === 'anxious' || emotionalState === 'pain') {
        mixingRate += 0.2;
      }
  
      if (Math.random() < mixingRate) {
        return this.insertKiswahiliElements(text);
      }
      
      return text;
    }
  
    insertKiswahiliElements(text) {
      // Replace common English words with Kiswahili
      const replacements = {
        'thank you': 'asante',
        'sorry': 'pole sana', 
        'yes': 'ndiyo',
        'no': 'hapana',
        'doctor': 'daktari',
        'pain': 'maumivu',
        'fever': 'homa',
        'head': 'kichwa',
        'stomach': 'tumbo'
      };
  
      let enhanced = text;
      
      // Selective replacement (not all instances)
      Object.entries(replacements).forEach(([english, kiswahili]) => {
        if (Math.random() < 0.4) { // 40% chance to replace
          enhanced = enhanced.replace(new RegExp(`\\b${english}\\b`, 'gi'), kiswahili);
        }
      });
  
      // Add occasional Kiswahili expressions
      if (Math.random() < 0.3) {
        const expressions = this.kenyanElements.kiswahili.common.expressions;
        const expression = expressions[Math.floor(Math.random() * expressions.length)];
        enhanced = `${expression}, ${enhanced}`;
      }
  
      return enhanced;
    }
  
    addCulturalReferences(text, socioeconomicLevel) {
      const socioConfig = this.socioeconomicFactors[socioeconomicLevel];
      
      if (Math.random() < 0.2) { // 20% chance to add cultural reference
        const categories = Object.keys(this.kenyanElements.culturalPhrases);
        const category = categories[Math.floor(Math.random() * categories.length)];
        const phrases = this.kenyanElements.culturalPhrases[category];
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        
        // Insert cultural reference naturally
        const sentences = text.split('. ');
        if (sentences.length > 1) {
          sentences.splice(1, 0, phrase);
          return sentences.join('. ');
        } else {
          return `${phrase}. ${text}`;
        }
      }
      
      return text;
    }
  
    adjustCommunicationStyle(text, educationLevel, socioeconomicLevel) {
      const eduConfig = this.educationLevels[educationLevel];
      const socioConfig = this.socioeconomicFactors[socioeconomicLevel];
      
      let adjusted = text;
      
      // Adjust formality based on background
      if (socioConfig.speech_patterns.includes('respectful_address')) {
        adjusted = adjusted.replace(/\byou\b/g, 'you, doctor');
        adjusted = adjusted.replace(/^/, 'Doctor, '); // Add respectful address at start
      }
      
      // Adjust complexity for education level
      if (eduConfig.communication_style === 'simple_terms') {
        // Simplify medical terms (this would be more sophisticated in production)
        adjusted = adjusted.replace(/symptoms/gi, 'how I feel');
        adjusted = adjusted.replace(/condition/gi, 'sickness');
      }
      
      return adjusted;
    }
  
    getGuardianCulturalBehavior(guardianProfile, situation) {
      const culturalBehaviors = {
        kenyan_mother: {
          protective: "I won't let anyone hurt my child",
          traditional: "We tried traditional medicine first, but...",
          religious: "We are praying for healing, but we know we need medical help too",
          family_oriented: "The whole family is worried about this",
          respectful: "Doctor, please help us understand what is wrong"
        },
        
        kenyan_father: {
          provider_concern: "I work hard to provide for my family, I need to know the cost",
          authority_respect: "You are the doctor, but please explain so I can understand",
          traditional_values: "In our culture, the father must make these decisions",
          practical: "What do we need to do to make the child better?"
        },
        
        kenyan_grandmother: {
          wisdom_keeper: "I have raised many children, but this is different",
          traditional_knowledge: "We tried the herbs the old people use, but...", 
          spiritual: "We believe God works through doctors like you",
          experienced: "I have seen this before in the village, but...",
          concerned: "This child is the future of our family"
        }
      };
  
      const guardianType = this.identifyGuardianType(guardianProfile);
      const behaviors = culturalBehaviors[guardianType] || culturalBehaviors.kenyan_mother;
      
      // Return behavior appropriate to situation
      if (situation === 'initial_concern') {
        return behaviors.protective || behaviors.concerned;
      } else if (situation === 'traditional_medicine') {
        return behaviors.traditional || behaviors.traditional_knowledge;
      } else if (situation === 'decision_making') {
        return behaviors.authority_respect || behaviors.practical;
      }
      
      return behaviors.protective;
    }
  
    identifyGuardianType(guardianProfile) {
      if (guardianProfile.relationship?.includes('mother')) return 'kenyan_mother';
      if (guardianProfile.relationship?.includes('father')) return 'kenyan_father'; 
      if (guardianProfile.relationship?.includes('grandmother')) return 'kenyan_grandmother';
      return 'kenyan_mother'; // default
    }
  
    getSocioeconomicConcerns(patientProfile) {
      const socioeconomic = patientProfile.socioeconomic || 'urban_informal';
      const concerns = this.socioeconomicFactors[socioeconomic].concerns;
      
      return concerns[Math.floor(Math.random() * concerns.length)];
    }
  
    getHealthcareNavigationHelp(situation, patientProfile) {
      const educationLevel = patientProfile.education || 'secondary';
      
      const navigationHelp = {
        insurance_questions: {
          primary: "I don't understand this insurance form",
          secondary: "Will NHIF cover this treatment?",
          tertiary: "What are my coverage options for this condition?"
        },
        
        follow_up_confusion: {
          primary: "When do I come back? I don't have transport money every day",
          secondary: "Can you write down when I should return?", 
          tertiary: "What's the follow-up protocol for this condition?"
        },
        
        medication_concerns: {
          primary: "These medicines are very expensive, is there a cheaper option?",
          secondary: "How long do I need to take these drugs?",
          tertiary: "Are there any drug interactions I should be aware of?"
        }
      };
  
      return navigationHelp[situation]?.[educationLevel] || navigationHelp[situation]?.secondary;
    }
  }
  
  module.exports = CulturalContextManager;