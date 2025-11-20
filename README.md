# WorkLife AI Coach

An AI-powered career coaching platform that provides personalized guidance to young professionals navigating career confusion, skill development, and workplace challenges.

## Features

- **Career Path Recommendations**: Generate personalized career paths based on user profiles with reasoning and trade-off analysis
- **Skill Guidance**: Prioritized skill recommendations with learning resources and dependency tracking
- **Action Planning**: Time-bound action steps (today, this week, this month) to prevent overwhelm
- **Growth Plans**: Long-term roadmaps with milestones and phases
- **Career Transition Guidance**: Field-to-field transition plans with transferable skill identification
- **In-Role Growth**: Guidance for advancing within current position
- **Mindset Support**: Emotional content detection with mindset-first response ordering
- **Session Continuity**: Multi-turn conversations with context preservation
- **Error Handling**: Graceful degradation for component failures

## Architecture

The system follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Coaching Engine                          │
│  - Request routing                                           │
│  - Component integration                                     │
│  - Error handling                                            │
└────────────┬───────────────────────────────┬────────────────┘
             │                               │
┌────────────▼────────────┐    ┌────────────▼────────────────┐
│   Conversation Manager  │    │   Recommendation Engine     │
│  - Session Management   │    │  - Career Path Generator    │
│  - Context Tracking     │    │  - Skill Recommender        │
│  - Intent Recognition   │    │  - Action Step Creator      │
└────────────┬────────────┘    │  - Growth Plan Builder      │
             │                 │  - Transition Advisor       │
             │                 │  - In-Role Growth Advisor   │
┌────────────▼────────────┐    └────────────┬────────────────┘
│   Profile Analyzer      │                 │
│  - Background Analysis  │                 │
│  - Gap Identification   │                 │
└────────────┬────────────┘                 │
             │                               │
┌────────────▼──────────────────────────────▼────────────────┐
│                    Data Persistence Layer                   │
│  - User Profiles                                            │
│  - Conversation History                                     │
│  - Progress Tracking                                        │
└─────────────────────────────────────────────────────────────┘
```

## Installation

```bash
npm install
```

## Usage

### Basic Example

```typescript
import { CoachingEngine } from './coachingEngine.js';
import { InMemoryDataStore } from './persistence/dataStore.js';

// Initialize the coaching engine
const dataStore = new InMemoryDataStore();
const coach = new CoachingEngine(dataStore);

// Process a coaching request
const response = await coach.processRequest({
  userId: 'user-123',
  message: 'I\'m not sure what career path to take'
});

console.log(response.content);
console.log('Intent:', response.intent.type);
console.log('Recommendations:', response.recommendations);
```

### Complete Example

See `src/example.ts` for a comprehensive demonstration of all features.

Run the example:
```bash
npm run dev
```

## Testing

The project includes comprehensive unit and integration tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Key Components

### CoachingEngine

The main integration point that coordinates all components:

- **Intent Recognition**: Classifies user messages into intent types
- **Request Routing**: Routes requests to appropriate recommendation systems
- **Response Formatting**: Combines recommendations into natural language
- **Error Handling**: Provides graceful degradation on failures

### ConversationManager

Manages multi-turn conversation sessions:

- Session lifecycle (start, continue, end)
- Context tracking and history
- Returning user recognition
- Recommendation consistency checking

### ProfileAnalyzer

Analyzes user profiles to extract insights:

- Strength and weakness identification
- Career stage determination
- Skill gap analysis
- Progress tracking

### Recommendation Engines

Specialized engines for different types of guidance:

- **CareerPathEngine**: Generates career path recommendations with fit scores
- **SkillRecommender**: Prioritizes skills based on career path and gaps
- **ActionStepGenerator**: Creates time-bound action steps
- **GrowthPlanBuilder**: Constructs long-term growth plans
- **TransitionAdvisor**: Provides career transition guidance
- **InRoleGrowthAdvisor**: Offers in-role advancement guidance

### ResponseFormatter

Formats recommendations into conversational responses:

- Natural language generation
- Actionable element inclusion
- Mindset-first ordering when needed
- Progress acknowledgment

## Intent Types

The system recognizes the following intent types:

- `profile_building`: Collecting user background information
- `career_clarity`: Seeking career direction and path recommendations
- `skill_guidance`: Requesting skill recommendations
- `action_planning`: Asking for next steps and action items
- `mindset_support`: Expressing emotional struggles or confidence issues
- `growth_planning`: Requesting long-term growth plans
- `transition_guidance`: Seeking career transition advice
- `progress_check`: Reporting completed actions or progress

## Error Handling

The system implements comprehensive error handling:

- **Component Failures**: Graceful degradation when individual components fail
- **Missing Data**: Sensible defaults and fallback responses
- **Invalid Input**: Validation and error messages
- **System Errors**: Fallback responses that maintain conversation flow

## Development

### Project Structure

```
src/
├── coachingEngine.ts          # Main integration engine
├── index.ts                   # Public API exports
├── example.ts                 # Usage examples
├── models/                    # Data models
│   ├── core.ts
│   └── recommendations.ts
├── conversation/              # Conversation management
│   ├── conversationManager.ts
│   └── responseFormatter.ts
├── intent/                    # Intent recognition
│   └── intentRecognizer.ts
├── profile/                   # Profile analysis
│   ├── profileAnalyzer.ts
│   └── profileCollector.ts
├── recommendations/           # Recommendation engines
│   ├── careerPathEngine.ts
│   ├── skillRecommender.ts
│   ├── actionStepGenerator.ts
│   ├── growthPlanBuilder.ts
│   ├── transitionAdvisor.ts
│   └── inRoleGrowthAdvisor.ts
└── persistence/               # Data storage
    └── dataStore.ts
```

### Building

```bash
npm run build
```

## License

MIT
