/**
 * Converts character stats into elegant prose descriptions
 * Enhanced with personality, social context, and sophisticated narrative generation
 */

import { PlayerCharacter } from '../types';

const getStatLevel = (value: number): 'very_low' | 'low' | 'average' | 'high' | 'very_high' => {
  if (value <= 3) return 'very_low';
  if (value <= 5) return 'low';
  if (value <= 7) return 'average';
  if (value <= 9) return 'high';
  return 'very_high';
};

const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Enhanced descriptors with more variety
const strengthDescriptors = {
  very_low: ['frail', 'weak', 'of feeble constitution', 'lacking in physical vigor', 'delicate of frame'],
  low: ['of modest strength', 'not particularly robust', 'lacking in physical power', 'somewhat weak of limb'],
  average: ['of average strength', 'reasonably robust', 'adequately powerful', 'of typical physical ability'],
  high: ['strong', 'powerful', 'robust of body', 'physically formidable', 'possessed of considerable strength'],
  very_high: ['exceptionally strong', 'remarkably powerful', 'of extraordinary physical might', 'physically imposing', 'possessed of tremendous strength'],
};

const intelligenceDescriptors = {
  very_low: ['simple-minded', 'slow of wit', 'of limited understanding', 'lacking in mental acuity', 'unlearned'],
  low: ['not particularly learned', 'of modest intellect', 'unscholarly', 'slow to grasp complex matters'],
  average: ['of average intelligence', 'reasonably clever', 'adequately learned', 'of typical mental capacity'],
  high: ['intelligent', 'clever', 'sharp-witted', 'learned', 'quick of mind', 'intellectually gifted'],
  very_high: ['brilliantly intelligent', 'exceptionally learned', 'of remarkable intellect', 'deeply scholarly', 'possessed of extraordinary mental acuity'],
};

const charismaDescriptors = {
  very_low: ['awkward in manner', 'socially inept', 'off-putting', 'difficult to warm to', 'lacking in personal magnetism'],
  low: ['unremarkable in presence', 'socially awkward', 'not particularly charming', 'modest in bearing'],
  average: ['of average charm', 'adequately personable', 'reasonably pleasant', 'neither remarkable nor off-putting'],
  high: ['charismatic', 'charming', 'personable', 'magnetic in personality', 'naturally engaging', 'possessed of considerable presence'],
  very_high: ['extraordinarily charismatic', 'captivating', 'of remarkable presence', 'naturally commanding', 'magnetically charming'],
};

const constitutionDescriptors = {
  very_low: ['sickly', 'frail of health', 'frequently ailing', 'of weak constitution', 'prone to illness'],
  low: ['not particularly hardy', 'somewhat frail', 'of modest constitution', 'susceptible to ailments'],
  average: ['of average health', 'reasonably hardy', 'adequately robust', 'of typical constitution'],
  high: ['hardy', 'resilient', 'of strong constitution', 'rarely ill', 'robust of health'],
  very_high: ['exceptionally hardy', 'remarkably resilient', 'almost never ill', 'of iron constitution', 'possessed of extraordinary vigor'],
};

const dexterityDescriptors = {
  very_low: ['clumsy', 'awkward in movement', 'ungainly', 'lacking coordination', 'prone to stumbling'],
  low: ['not particularly agile', 'somewhat clumsy', 'of modest dexterity', 'slow of hand'],
  average: ['of average agility', 'reasonably coordinated', 'adequately nimble', 'of typical grace'],
  high: ['agile', 'nimble', 'quick', 'well-coordinated', 'graceful in movement', 'deft of hand'],
  very_high: ['extraordinarily agile', 'remarkably nimble', 'of exceptional dexterity', 'lightning-quick', 'possessed of extraordinary grace'],
};

const wisdomDescriptors = {
  very_low: ['foolish', 'lacking in judgement', 'imprudent', 'rash', 'prone to poor decisions'],
  low: ['not particularly wise', 'somewhat impulsive', 'of modest judgement', 'lacking in foresight'],
  average: ['of average wisdom', 'reasonably prudent', 'adequately judicious', 'of sound judgement'],
  high: ['wise', 'prudent', 'judicious', 'perceptive', 'possessed of keen insight', 'discerning'],
  very_high: ['exceptionally wise', 'remarkably perceptive', 'of profound insight', 'deeply intuitive', 'possessed of extraordinary wisdom'],
};

// Personality-based observations
const getPersonalityObservations = (character: PlayerCharacter): string[] => {
  const sentences: string[] = [];
  const { personality, socialContext, stats } = character;

  // Extraversion observations
  if (personality.extraversion > 0.7) {
    if (stats.charisma > 7) {
      sentences.push(pickRandom([
        'Your outgoing nature draws others to you naturally.',
        'You find great satisfaction in the company of others.',
        'Few gatherings feel complete without your lively presence.'
      ]));
    } else {
      sentences.push('Though gregarious by nature, your manner sometimes puts others off.');
    }
  } else if (personality.extraversion < 0.3) {
    if (stats.wisdom > 7) {
      sentences.push(pickRandom([
        'Your reserved nature masks a contemplative mind.',
        'You find solace in solitude and quiet reflection.',
        'Your reticent manner conceals depths of thought.'
      ]));
    } else {
      sentences.push('You are withdrawn by nature, often preferring your own company.');
    }
  }

  // Conscientiousness observations
  if (personality.conscientiousness > 0.75) {
    sentences.push(pickRandom([
      'You approach your work with meticulous care.',
      'Order and discipline guide your every action.',
      'You are known for your reliability and attention to detail.',
      'Your methodical nature serves you well in your endeavors.'
    ]));
  } else if (personality.conscientiousness < 0.25) {
    sentences.push(pickRandom([
      'You have little patience for order or routine.',
      'Your spontaneous nature often leads you to unexpected places.',
      'Structure and discipline hold little appeal for you.'
    ]));
  }

  // Openness to experience
  if (personality.openness > 0.75 && stats.intelligence > 6) {
    sentences.push(pickRandom([
      'Your curious mind constantly seeks new knowledge and experiences.',
      'You possess an insatiable appetite for novel ideas.',
      'Convention and tradition bore you; you seek the new and unusual.'
    ]));
  } else if (personality.openness < 0.25) {
    sentences.push(pickRandom([
      'You find comfort in the familiar and traditional.',
      'The old ways suit you better than newfangled notions.',
      'You are suspicious of novelty and change.'
    ]));
  }

  // Agreeableness combined with stats
  if (personality.agreeableness > 0.75) {
    if (stats.charisma > 7) {
      sentences.push('Your kind and cooperative nature endears you to nearly everyone you meet.');
    } else if (stats.wisdom < 5) {
      sentences.push('Your trusting nature sometimes leaves you vulnerable to exploitation.');
    }
  } else if (personality.agreeableness < 0.25) {
    if (stats.strength > 7 || stats.charisma > 7) {
      sentences.push('Your assertive, even confrontational manner can be intimidating to others.');
    } else {
      sentences.push('You are difficult and contrary by nature.');
    }
  }

  // Neuroticism
  if (personality.neuroticism > 0.75) {
    sentences.push(pickRandom([
      'Anxiety and worry are your constant companions.',
      'You are prone to melancholy and dark moods.',
      'Your temperament is volatile and easily disturbed.'
    ]));
  } else if (personality.neuroticism < 0.25 && stats.constitution > 6) {
    sentences.push('You possess a remarkably calm and even temperament.');
  }

  return sentences;
};

// Social context observations
const getSocialObservations = (character: PlayerCharacter): string[] => {
  const sentences: string[] = [];
  const { socialContext, profession, stats, wealthLevel } = character;

  // Ambition
  if (socialContext.ambition > 0.75) {
    if (stats.intelligence > 7) {
      sentences.push(pickRandom([
        'Your ambitions drive you relentlessly toward advancement.',
        'You are determined to rise above your current station.',
        'Nothing will keep you from achieving your goals.'
      ]));
    } else if (stats.charisma > 7) {
      sentences.push('You seek recognition and status with unwavering determination.');
    } else {
      sentences.push('Your ambitions exceed your abilities, creating constant frustration.');
    }
  } else if (socialContext.ambition < 0.25) {
    sentences.push(pickRandom([
      'You are content with your place in the world.',
      'Advancement holds little interest for you.',
      'You lack the drive that propels others to greatness.'
    ]));
  }

  // Religiosity
  if (socialContext.religiosity > 0.8) {
    if (stats.wisdom > 7) {
      sentences.push('Your deep faith provides wisdom and guidance in all matters.');
    } else if (stats.intelligence < 5) {
      sentences.push('Your piety borders on fanaticism.');
    } else {
      sentences.push('Religious devotion shapes every aspect of your life.');
    }
  } else if (socialContext.religiosity < 0.2) {
    sentences.push(pickRandom([
      'You give little thought to matters of faith.',
      'Religious observance holds minimal importance for you.',
      'You are skeptical of religious claims and traditions.'
    ]));
  }

  // Wanderlust
  if (socialContext.wanderlust > 0.75) {
    sentences.push(pickRandom([
      'You are restless by nature, always dreaming of distant horizons.',
      'The urge to wander and explore dominates your thoughts.',
      'You chafe at the confines of settled life.'
    ]));
  }

  // Entrepreneurial spirit
  if (socialContext.entrepreneurial > 0.75 && stats.intelligence > 6) {
    sentences.push(pickRandom([
      'You possess a keen eye for opportunity and profit.',
      'Your enterprising nature seeks advantage in every situation.',
      'You are always scheming new ventures and enterprises.'
    ]));
  }

  // Privilege and stats
  if (socialContext.privilege > 0.7 && (wealthLevel === 'wealthy' || wealthLevel === 'noble')) {
    if (stats.charisma < 5) {
      sentences.push('Your privileged upbringing has left you ill-prepared for adversity.');
    } else if (stats.wisdom > 7) {
      sentences.push('Despite your advantages, you possess genuine wisdom and compassion.');
    }
  } else if (socialContext.privilege < 0.3 && (wealthLevel === 'poor' || wealthLevel === 'modest')) {
    if (stats.strength > 7 || stats.constitution > 7) {
      sentences.push('A lifetime of hardship has forged you into something formidable.');
    }
  }

  return sentences;
};

// Physical contrasts and observations
const getPhysicalObservations = (character: PlayerCharacter): string[] => {
  const sentences: string[] = [];
  const { stats, appearance, age } = character;

  const strLevel = getStatLevel(stats.strength);
  const dexLevel = getStatLevel(stats.dexterity);
  const conLevel = getStatLevel(stats.constitution);

  // Build and strength contrasts
  const isSlim = appearance.build === 'slight' || appearance.build === 'thin';
  const isHeavy = appearance.build === 'heavy' || appearance.build === 'stocky';

  if (isSlim && (strLevel === 'high' || strLevel === 'very_high')) {
    sentences.push(pickRandom([
      'Your slender frame belies surprising strength.',
      'Despite your slight build, you possess uncommon power.',
      'Your wiry physique conceals considerable strength.'
    ]));
  } else if (isHeavy && strLevel === 'very_low') {
    sentences.push('Your bulk is more impediment than advantage.');
  }

  // Age-related observations
  const isYouth = age < 25;
  const isPrime = age >= 25 && age <= 45;
  const isMiddleAged = age > 45 && age <= 60;
  const isElderly = age > 60;

  if (isYouth && stats.wisdom > 8) {
    sentences.push('You possess wisdom well beyond your years.');
  } else if (isYouth && stats.wisdom < 4) {
    sentences.push('Youth has blessed you with vitality but cursed you with impetuousness.');
  }

  if (isElderly && dexLevel === 'very_high') {
    sentences.push(pickRandom([
      'Age has dimmed neither your reflexes nor your grace.',
      'The years have been remarkably kind to your agility.',
      'You move with a sprightliness that defies your years.'
    ]));
  } else if (isElderly && conLevel === 'very_low') {
    sentences.push('The burden of years weighs heavily upon you.');
  }

  if (isMiddleAged && stats.strength > 8 && conLevel > 7) {
    sentences.push('You are at the peak of your physical powers.');
  }

  if (isYouth && conLevel === 'very_low') {
    sentences.push('Even in youth, illness plagues you constantly.');
  }

  return sentences;
};

// Mental and social contrasts
const getMentalSocialObservations = (character: PlayerCharacter): string[] => {
  const sentences: string[] = [];
  const { stats, profession } = character;

  const chaLevel = getStatLevel(stats.charisma);
  const intLevel = getStatLevel(stats.intelligence);
  const wisLevel = getStatLevel(stats.wisdom);

  // Intelligence vs Wisdom contrasts
  if (intLevel === 'very_high' && wisLevel === 'very_low') {
    sentences.push(pickRandom([
      'Your considerable learning is undermined by poor judgement.',
      'Though learned, you frequently make foolish decisions.',
      'Intelligence without wisdom has led you into many follies.'
    ]));
  } else if (wisLevel === 'very_high' && intLevel === 'low') {
    sentences.push(pickRandom([
      'Though unlettered, you possess profound practical wisdom.',
      'Your lack of formal education belies genuine insight.',
      'Natural wisdom compensates for limited schooling.'
    ]));
  } else if (intLevel === 'very_high' && wisLevel === 'very_high') {
    sentences.push('You are blessed with both learning and wisdom, a rare combination.');
  }

  // Charisma vs Intelligence
  if (chaLevel === 'very_high' && intLevel === 'very_low') {
    sentences.push(pickRandom([
      'Your charm allows you to conceal your intellectual limitations.',
      'Personal magnetism compensates for limited learning.',
      'What you lack in wit, you make up for in winning ways.'
    ]));
  } else if (chaLevel === 'very_low' && intLevel === 'very_high') {
    sentences.push(pickRandom([
      'Your brilliance is obscured by poor social graces.',
      'A keen mind trapped in an awkward manner.',
      'Your intellect cannot overcome your off-putting demeanor.'
    ]));
  }

  // Charisma vs Wisdom
  if (chaLevel === 'very_high' && wisLevel === 'very_low') {
    sentences.push('Your charm is matched only by your lack of judgement.');
  } else if (chaLevel === 'very_high' && wisLevel === 'very_high') {
    sentences.push('Rare is the combination of magnetic charm and profound wisdom you possess.');
  }

  // Profession-based observations
  const laborProfessions = ['farmer', 'blacksmith', 'miner', 'carpenter', 'fisherman', 'peasant', 'laborer'];
  const scholarProfessions = ['scholar', 'scribe', 'priest', 'teacher', 'physician', 'clerk', 'monk'];
  const merchantProfessions = ['merchant', 'trader', 'banker', 'shopkeeper', 'vendor'];
  const militaryProfessions = ['soldier', 'knight', 'warrior', 'guard', 'mercenary'];

  const profLower = profession.toLowerCase();
  const isLaborer = laborProfessions.some(p => profLower.includes(p));
  const isScholar = scholarProfessions.some(p => profLower.includes(p));
  const isMerchant = merchantProfessions.some(p => profLower.includes(p));
  const isMilitary = militaryProfessions.some(p => profLower.includes(p));

  if (isLaborer && intLevel === 'very_high') {
    sentences.push(`Your work as a ${profession} fails to exercise your considerable intellect.`);
  } else if (isScholar && intLevel === 'very_low') {
    sentences.push(`You hold a learned position despite limited scholarly abilities.`);
  }

  if (isMerchant && chaLevel === 'very_low') {
    sentences.push('Your difficult manner is ill-suited to commerce.');
  } else if (isMerchant && (intLevel === 'very_high' || wisLevel === 'very_high')) {
    sentences.push('Your mental acuity serves you well in business.');
  }

  if (isMilitary && stats.strength > 8 && dexLevel === 'very_high') {
    sentences.push('You are ideally suited to the martial life.');
  } else if (isMilitary && stats.strength < 5) {
    sentences.push('Physical weakness makes military service a constant trial.');
  }

  return sentences;
};

export const generateStatDescription = (character: PlayerCharacter): string => {
  const { stats, age } = character;
  const sentences: string[] = [];

  // Get stat levels
  const strLevel = getStatLevel(stats.strength);
  const intLevel = getStatLevel(stats.intelligence);
  const chaLevel = getStatLevel(stats.charisma);
  const conLevel = getStatLevel(stats.constitution);
  const dexLevel = getStatLevel(stats.dexterity);
  const wisLevel = getStatLevel(stats.wisdom);

  // Opening physical description
  const physicalParts: string[] = [];

  if (strLevel !== 'average') {
    physicalParts.push(`${pickRandom(strengthDescriptors[strLevel])}`);
  }

  if (conLevel !== 'average' && conLevel !== strLevel) {
    const connector = physicalParts.length > 0 ? pickRandom(['and', 'yet']) : '';
    physicalParts.push(`${connector} ${pickRandom(constitutionDescriptors[conLevel])}`);
  }

  if (physicalParts.length > 0) {
    sentences.push(`You are ${physicalParts.join(' ')}.`);
  }

  // Agility with context
  if (dexLevel !== 'average') {
    const ageContext = age > 50 ? pickRandom([', despite your years', ', though age should have slowed you', '']) : '';
    const youthContext = age < 25 && dexLevel === 'very_high' ? ', blessed with the quickness of youth' : '';
    sentences.push(`You are ${pickRandom(dexterityDescriptors[dexLevel])}${ageContext}${youthContext}.`);
  }

  // Mental attributes with more variety
  const mentalParts: string[] = [];

  if (intLevel !== 'average') {
    mentalParts.push(`${pickRandom(intelligenceDescriptors[intLevel])}`);
  }

  if (wisLevel !== 'average' && Math.abs(stats.intelligence - stats.wisdom) > 2) {
    const connector = mentalParts.length > 0 ? (stats.wisdom > stats.intelligence ? 'yet' : 'though') : '';
    mentalParts.push(`${connector} ${pickRandom(wisdomDescriptors[wisLevel])}`);
  } else if (wisLevel !== 'average') {
    const connector = mentalParts.length > 0 ? 'and' : '';
    mentalParts.push(`${connector} ${pickRandom(wisdomDescriptors[wisLevel])}`);
  }

  if (mentalParts.length > 0) {
    sentences.push(`You are ${mentalParts.join(' ')}.`);
  }

  // Social characteristics
  if (chaLevel !== 'average') {
    sentences.push(`You are ${pickRandom(charismaDescriptors[chaLevel])}.`);
  }

  // Add sophisticated observations
  const physical = getPhysicalObservations(character);
  const mentalSocial = getMentalSocialObservations(character);
  const personality = getPersonalityObservations(character);
  const social = getSocialObservations(character);

  // Intelligently select observations to avoid overwhelming
  const allObservations = [...physical, ...mentalSocial, ...personality, ...social];

  // Select 2-4 most interesting observations
  const selectedCount = Math.min(Math.max(2, Math.floor(allObservations.length * 0.4)), 4);
  const shuffled = allObservations.sort(() => Math.random() - 0.5);
  sentences.push(...shuffled.slice(0, selectedCount));

  // Fallback for very average characters
  if (sentences.length < 2) {
    sentences.unshift(pickRandom([
      'You are unremarkable in most respects, neither blessed nor cursed with exceptional qualities.',
      'You possess no attributes that set you apart from the common run of humanity.',
      'Your qualities, such as they are, are thoroughly ordinary.'
    ]));
  }

  return sentences.join(' ');
};
