/**
 * constants/gameData/goals.ts - Defines goal targets for NPC personal goals
 */
import { GoalTarget } from '../../types';

/**
 * Goal targets define what NPCs might be pursuing
 * This is a placeholder implementation - can be expanded with actual goals
 */
export const GOAL_TARGETS: GoalTarget[] = [
  // Wealth/Resource goals
  {
    id: 'ACQUIRE_WEALTH',
    targetType: 'RESOURCE',
    archetypes: ['ACQUIRE'],
    descriptionTemplate: 'amass a fortune',
    constraints: {
      wealthLevels: ['poor', 'modest'],
      socialContext: {
        minAmbition: 0.6
      }
    }
  },
  {
    id: 'PROTECT_FAMILY',
    targetType: 'NPC',
    archetypes: ['PROTECT'],
    descriptionTemplate: 'keep their family safe',
    constraints: {
      hasFamily: true
    }
  },
  {
    id: 'DISCOVER_TRUTH',
    targetType: 'CONCEPT',
    archetypes: ['DISCOVER'],
    descriptionTemplate: 'uncover a hidden truth',
    constraints: {
      personality: {
        minOpenness: 0.6
      }
    }
  },
  {
    id: 'ASCEND_SOCIALLY',
    targetType: 'CONCEPT',
    archetypes: ['ASCEND'],
    descriptionTemplate: 'rise above their station',
    constraints: {
      socialContext: {
        minAmbition: 0.7
      }
    }
  },
  // Add more goals as needed
];
