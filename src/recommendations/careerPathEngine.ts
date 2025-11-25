/**
 * Career Path Recommendation Engine
 * Generates personalized career path recommendations based on user profiles
 */

import { UserProfile, CareerPath } from '../models/index.js';

/**
 * Generates career path recommendations for a user profile
 * @param profile - The user profile to analyze
 * @returns Array of recommended career paths with reasoning and scores
 */
export function generateCareerPaths(profile: UserProfile): CareerPath[] {
  const paths: CareerPath[] = [];
  
  // Extract key profile attributes
  const { interests, goals, struggles } = profile.careerInfo;
  const { current: currentSkills } = profile.skills;
  const { industry, currentRole, yearsOfExperience } = profile.personalInfo;
  
  // Generate paths based on profile analysis
  const candidatePaths = identifyCandidatePaths(profile);
  
  for (const candidate of candidatePaths) {
    const fitScore = calculateFitScore(profile, candidate);
    const reasoning = generateReasoning(profile, candidate, fitScore);
    
    paths.push({
      id: generatePathId(candidate.title),
      title: candidate.title,
      description: candidate.description,
      reasoning,
      fitScore,
      requiredSkills: candidate.requiredSkills,
      timeToTransition: estimateTransitionTime(profile, candidate),
      growthPotential: candidate.growthPotential,
    });
  }
  
  // Sort by fit score (highest first)
  paths.sort((a, b) => b.fitScore - a.fitScore);
  
  // Ensure at least one path is returned
  if (paths.length === 0) {
    paths.push(generateDefaultPath(profile));
  }
  
  return paths;
}

/**
 * Career path candidate template
 */
interface PathCandidate {
  title: string;
  description: string;
  requiredSkills: string[];
  growthPotential: number;
  matchingInterests: string[];
  matchingSkills: string[];
}

/**
 * Identifies candidate career paths based on user profile
 */
function identifyCandidatePaths(profile: UserProfile): PathCandidate[] {
  const candidates: PathCandidate[] = [];
  const { interests, goals } = profile.careerInfo;
  const { current: currentSkills } = profile.skills;
  const { industry, currentRole } = profile.personalInfo;
  
  // Define career path templates based on common patterns
  const pathTemplates = getCareerPathTemplates();
  
  for (const template of pathTemplates) {
    const matchingInterests = interests.filter(interest => 
      template.keywords.some(keyword => 
        interest.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    const matchingSkills = currentSkills.filter(skill =>
      template.relatedSkills.some(reqSkill =>
        skill.name.toLowerCase().includes(reqSkill.toLowerCase())
      )
    );
    
    // Include path if there's any match with interests or skills
    if (matchingInterests.length > 0 || matchingSkills.length > 0 || 
        (industry && template.industries.includes(industry.toLowerCase()))) {
      candidates.push({
        title: template.title,
        description: template.description,
        requiredSkills: template.requiredSkills,
        growthPotential: template.growthPotential,
        matchingInterests,
        matchingSkills: matchingSkills.map(s => s.name),
      });
    }
  }
  
  // Always include current role advancement if they have a current role
  if (currentRole) {
    candidates.push({
      title: `Senior ${currentRole}`,
      description: `Advance to a senior position in your current role as ${currentRole}`,
      requiredSkills: ['leadership', 'advanced technical skills', 'mentoring'],
      growthPotential: 0.7,
      matchingInterests: [],
      matchingSkills: currentSkills.map(s => s.name),
    });
  }
  
  return candidates;
}

/**
 * Calculates fit score for a career path based on profile alignment
 */
function calculateFitScore(profile: UserProfile, candidate: PathCandidate): number {
  let score = 0;
  let maxScore = 0;
  
  // Interest alignment (40% weight)
  const interestWeight = 0.4;
  const interestScore = candidate.matchingInterests.length > 0 ? 
    Math.min(candidate.matchingInterests.length / 3, 1) : 0;
  score += interestScore * interestWeight;
  maxScore += interestWeight;
  
  // Skill alignment (30% weight)
  const skillWeight = 0.3;
  const skillScore = candidate.matchingSkills.length > 0 ?
    Math.min(candidate.matchingSkills.length / 5, 1) : 0;
  score += skillScore * skillWeight;
  maxScore += skillWeight;
  
  // Growth potential (20% weight)
  const growthWeight = 0.2;
  score += candidate.growthPotential * growthWeight;
  maxScore += growthWeight;
  
  // Experience alignment (10% weight)
  const experienceWeight = 0.1;
  const yearsExp = profile.personalInfo.yearsOfExperience;
  const experienceScore = yearsExp >= 2 ? Math.min(yearsExp / 10, 1) : 0.5;
  score += experienceScore * experienceWeight;
  maxScore += experienceWeight;
  
  // Normalize to 0-1 range
  return maxScore > 0 ? score / maxScore : 0;
}

/**
 * Generates reasoning for why a career path is recommended
 */
function generateReasoning(profile: UserProfile, candidate: PathCandidate, fitScore: number): string {
  const reasons: string[] = [];
  
  // Interest-based reasoning
  if (candidate.matchingInterests.length > 0) {
    reasons.push(
      `This path aligns with your interests in ${candidate.matchingInterests.slice(0, 2).join(' and ')}`
    );
  }
  
  // Skill-based reasoning
  if (candidate.matchingSkills.length > 0) {
    reasons.push(
      `You already have relevant skills like ${candidate.matchingSkills.slice(0, 2).join(' and ')}`
    );
  }
  
  // Growth potential reasoning
  if (candidate.growthPotential >= 0.7) {
    reasons.push('This field offers strong growth potential and career advancement opportunities');
  }
  
  // Experience-based reasoning
  const yearsExp = profile.personalInfo.yearsOfExperience;
  if (yearsExp >= 3) {
    reasons.push('Your experience level makes you well-positioned for this transition');
  } else if (yearsExp < 2) {
    reasons.push('This path is accessible for early-career professionals');
  }
  
  // Default reasoning if no specific matches
  if (reasons.length === 0) {
    reasons.push('This path offers opportunities for professional growth and skill development');
  }
  
  return reasons.join('. ') + '.';
}

/**
 * Estimates transition time based on profile and target path
 */
function estimateTransitionTime(profile: UserProfile, candidate: PathCandidate): string {
  const { current: currentSkills } = profile.skills;
  const yearsExp = profile.personalInfo.yearsOfExperience;
  
  // Calculate skill gap
  const hasSkills = candidate.requiredSkills.filter(reqSkill =>
    currentSkills.some(skill => 
      skill.name.toLowerCase().includes(reqSkill.toLowerCase())
    )
  ).length;
  
  const skillGapRatio = candidate.requiredSkills.length > 0 ?
    1 - (hasSkills / candidate.requiredSkills.length) : 0.5;
  
  // Estimate based on skill gap and experience
  if (skillGapRatio < 0.3 && yearsExp >= 2) {
    return '3-6 months';
  } else if (skillGapRatio < 0.5) {
    return '6-12 months';
  } else if (skillGapRatio < 0.7) {
    return '12-18 months';
  } else {
    return '18-24 months';
  }
}

/**
 * Generates a unique ID for a career path
 */
function generatePathId(title: string): string {
  return `path-${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
}

/**
 * Generates a default career path when no specific matches are found
 */
function generateDefaultPath(profile: UserProfile): CareerPath {
  const currentRole = profile.personalInfo.currentRole || 'professional';
  
  return {
    id: generatePathId('general-career-development'),
    title: 'General Career Development',
    description: 'Focus on building foundational skills and exploring career options',
    reasoning: 'Based on your profile, we recommend starting with skill development and career exploration to identify the best path forward.',
    fitScore: 0.5,
    requiredSkills: ['communication', 'problem-solving', 'time management'],
    timeToTransition: '6-12 months',
    growthPotential: 0.6,
  };
}

/**
 * Career path template definition
 */
interface PathTemplate {
  title: string;
  description: string;
  keywords: string[];
  requiredSkills: string[];
  relatedSkills: string[];
  industries: string[];
  growthPotential: number;
}

/**
 * Returns predefined career path templates
 */
function getCareerPathTemplates(): PathTemplate[] {
  return [
    {
      title: 'Software Engineering',
      description: 'Build and maintain software applications and systems',
      keywords: ['coding', 'programming', 'software', 'development', 'tech', 'computer'],
      requiredSkills: ['programming', 'algorithms', 'system design', 'testing'],
      relatedSkills: ['javascript', 'python', 'java', 'coding', 'programming'],
      industries: ['technology', 'software', 'tech'],
      growthPotential: 0.9,
    },
    {
      title: 'Data Science',
      description: 'Analyze data and build predictive models to drive business decisions',
      keywords: ['data', 'analytics', 'statistics', 'machine learning', 'ai'],
      requiredSkills: ['statistics', 'python', 'machine learning', 'data visualization'],
      relatedSkills: ['python', 'sql', 'statistics', 'analytics', 'data'],
      industries: ['technology', 'finance', 'healthcare'],
      growthPotential: 0.9,
    },
    {
      title: 'Product Management',
      description: 'Lead product strategy and development from conception to launch',
      keywords: ['product', 'strategy', 'management', 'leadership', 'business'],
      requiredSkills: ['product strategy', 'stakeholder management', 'roadmapping', 'analytics'],
      relatedSkills: ['management', 'leadership', 'strategy', 'communication'],
      industries: ['technology', 'business', 'consulting'],
      growthPotential: 0.85,
    },
    {
      title: 'UX/UI Design',
      description: 'Design user experiences and interfaces for digital products',
      keywords: ['design', 'user experience', 'ux', 'ui', 'creative', 'visual'],
      requiredSkills: ['user research', 'prototyping', 'visual design', 'interaction design'],
      relatedSkills: ['design', 'figma', 'sketch', 'creative', 'visual'],
      industries: ['technology', 'design', 'creative'],
      growthPotential: 0.8,
    },
    {
      title: 'Digital Marketing',
      description: 'Drive customer acquisition and engagement through digital channels',
      keywords: ['marketing', 'social media', 'content', 'advertising', 'growth'],
      requiredSkills: ['seo', 'content marketing', 'analytics', 'social media'],
      relatedSkills: ['marketing', 'writing', 'communication', 'analytics'],
      industries: ['marketing', 'business', 'technology'],
      growthPotential: 0.75,
    },
    {
      title: 'Business Analysis',
      description: 'Bridge business needs and technical solutions through data-driven insights',
      keywords: ['business', 'analysis', 'consulting', 'strategy', 'operations'],
      requiredSkills: ['business analysis', 'requirements gathering', 'process improvement', 'sql'],
      relatedSkills: ['analysis', 'sql', 'excel', 'business', 'data'],
      industries: ['business', 'consulting', 'finance'],
      growthPotential: 0.75,
    },
    {
      title: 'Project Management',
      description: 'Plan, execute, and deliver projects on time and within budget',
      keywords: ['project', 'management', 'coordination', 'planning', 'agile'],
      requiredSkills: ['project planning', 'agile', 'risk management', 'stakeholder communication'],
      relatedSkills: ['management', 'planning', 'coordination', 'leadership'],
      industries: ['business', 'technology', 'consulting'],
      growthPotential: 0.7,
    },
  ];
}

/**
 * Identifies trade-offs between multiple career paths
 * @param paths - Array of career paths to compare
 * @returns Paths with trade-off information added to reasoning
 */
export function identifyTradeOffs(paths: CareerPath[]): CareerPath[] {
  if (paths.length <= 1) {
    return paths;
  }
  
  // Add trade-off information to each path's reasoning
  return paths.map((path, index) => {
    const tradeOffs: string[] = [];
    
    // Compare with other paths
    const otherPaths = paths.filter((_, i) => i !== index);
    
    // Identify unique advantages
    const hasHighestFit = paths.every((p, i) => i === index || path.fitScore >= p.fitScore);
    const hasShortestTransition = paths.every((p, i) => 
      i === index || compareTransitionTime(path.timeToTransition, p.timeToTransition) <= 0
    );
    const hasHighestGrowth = paths.every((p, i) => 
      i === index || path.growthPotential >= p.growthPotential
    );
    
    if (hasHighestFit) {
      tradeOffs.push('Best overall fit for your profile');
    }
    
    if (hasShortestTransition) {
      tradeOffs.push('Fastest path to transition');
    } else {
      const fastest = paths.reduce((min, p) => 
        compareTransitionTime(p.timeToTransition, min.timeToTransition) < 0 ? p : min
      );
      tradeOffs.push(`Longer transition time compared to ${fastest.title}`);
    }
    
    if (hasHighestGrowth) {
      tradeOffs.push('Highest long-term growth potential');
    } else {
      const highestGrowth = paths.reduce((max, p) => 
        p.growthPotential > max.growthPotential ? p : max
      );
      tradeOffs.push(`Lower growth potential than ${highestGrowth.title}`);
    }
    
    // Add trade-offs to reasoning
    const enhancedReasoning = tradeOffs.length > 0
      ? `${path.reasoning} Trade-offs: ${tradeOffs.join('; ')}.`
      : path.reasoning;
    
    return {
      ...path,
      reasoning: enhancedReasoning,
    };
  });
}

/**
 * Compares two transition time strings
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 */
function compareTransitionTime(a: string, b: string): number {
  const extractMonths = (time: string): number => {
    const match = time.match(/(\d+)-?(\d+)?\s*months?/i);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      return (min + max) / 2;
    }
    return 12; // Default to 12 months if can't parse
  };
  
  const monthsA = extractMonths(a);
  const monthsB = extractMonths(b);
  
  return monthsA < monthsB ? -1 : monthsA > monthsB ? 1 : 0;
}
