# System Terminology Glossary

**Effective Date**: 2025-10-17  
**Author**: Kilo Code System  
**Review Cycle**: Quarterly

## Core Concepts

### Case Management
- **Case**: A clinical scenario or simulation used for educational purposes
- **Case Template**: Predefined structure for creating consistent cases
- **Specialty**: Medical specialty area (e.g., Internal Medicine, Radiology, Laboratory, Ophthalmology, Nursing)
- **Subspecialty**: Specialized area within a medical specialty
- **Program Area**: Educational program category (Basic Program, Specialty Program)
- **Learning Objectives**: Specific educational goals for a case
- **Clinical Content**: Patient data, symptoms, diagnostic information, treatment options
- **Clinical Dossier**: Comprehensive patient information and medical history
- **Patient Persona**: Demographic and personal information about the simulated patient

### User Roles
- **Educator**: User who creates and manages educational cases
- **Student**: User who participates in case simulations
- **Administrator**: User with system-wide permissions
- **Reviewer**: User responsible for quality assurance of cases
- **Clinician**: Healthcare professional using the system for training
- **Super Admin**: Highest level administrator with all permissions
- **Content Creator**: User focused on developing educational content

### System Components
- **Simulation**: Interactive case experience for students
- **Progress Tracking**: Monitoring of student performance and completion
- **Assessment**: Evaluation of student performance within cases
- **Feedback**: Information provided to students about their performance
- **Learning Path**: Personalized sequence of educational activities
- **Competency Framework**: Structure for evaluating clinical skills
- **Performance Analytics**: Data analysis of student progress and outcomes
- **Case Publishing**: Process of making cases available to students
- **Content Repository**: Storage system for educational materials
- **Session Management**: Handling of user sessions and state
- **Error Boundary**: React component for handling runtime errors

## Technical Terms

### Frontend
- **Component**: Reusable React UI element
- **State**: Data managed within React components
- **Props**: Properties passed to React components
- **Hook**: React function for managing state and side effects
- **Service**: Class for handling API communications
- **Context**: React feature for sharing data between components
- **Reducer**: Function for managing complex state logic
- **Middleware**: Function that processes actions before reaching reducers
- **Action**: Payload of information for state updates
- **Selector**: Function for deriving computed values from state
- **Thunk**: Function that returns another function for async operations

### Backend
- **Route**: API endpoint definition
- **Middleware**: Function that processes requests before handlers
- **Service Layer**: Business logic implementation
- **Model**: Database schema definition
- **Controller**: Request handling logic

### Database
- **Collection**: MongoDB table equivalent
- **Document**: MongoDB record equivalent
- **Schema**: Data structure definition
- **Index**: Database optimization structure
- **Query**: Database request operation

## Authentication & Authorization
- **JWT**: JSON Web Token for authentication
- **RBAC**: Role-Based Access Control
- **Permission**: Specific action a role can perform
- **Authorization**: Process of verifying user permissions
- **Authentication**: Process of verifying user identity

## Workflow Terms
- **Pipeline**: Sequence of processing steps
- **Validation**: Process of checking data correctness
- **Publication**: Making content available to users
- **Review**: Quality assurance process
- **Approval**: Formal acceptance of content

## Performance Metrics
- **Response Time**: Time taken to process a request
- **Throughput**: Number of requests processed per time unit
- **Latency**: Delay in data transmission
- **Scalability**: System's ability to handle increased load
- **Availability**: System uptime percentage

## Medical Education Terms
- **Clinical Reasoning**: Process of thinking through patient problems
- **Differential Diagnosis**: Systematic consideration of possible conditions
- **Evidence-Based Medicine**: Medical decisions based on research evidence
- **Competency-Based Education**: Learning focused on specific skills
- **Formative Assessment**: Evaluation to guide learning and improvement
- **Summative Assessment**: Evaluation to measure achievement
- **Self-Directed Learning**: Independent, autonomous learning process
- **Reflective Practice**: Critical analysis of one's own performance
- **Interprofessional Education**: Learning with different healthcare professions
- **Simulation-Based Learning**: Education using simulated clinical scenarios

## Development Terms
- **Repository**: Version control storage location
- **Branch**: Parallel development line
- **Merge**: Combining code changes
- **Deployment**: Process of releasing software
- **Environment**: Configuration for different stages (dev, staging, prod)

## Related Documentation
- [System Architecture Overview](../architecture/system-overview.md)
- [API Service Pattern](../patterns/api-service-pattern.md)
- [Error Boundary Pattern](../patterns/error-boundary-pattern.md)
- [Service Layer Pattern](../patterns/service-layer-pattern.md)
- [Case Creation Workflow](../workflows/case-creation-workflow.md)
- [Student Simulation Workflow](../workflows/student-simulation-workflow.md)
- [Assessment and Feedback Workflow](../workflows/assessment-feedback-workflow.md)
- [Authentication System](../../../SimulatorBackend/docs/Authentication_System.md)

## Acronyms
- **API**: Application Programming Interface
- **CRUD**: Create, Read, Update, Delete
- **DOM**: Document Object Model
- **HTTP**: Hypertext Transfer Protocol
- **JSON**: JavaScript Object Notation
- **REST**: Representational State Transfer
- **SQL**: Structured Query Language
- **UI**: User Interface
- **UX**: User Experience
- **URL**: Uniform Resource Locator