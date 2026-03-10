# Fizzi Challenger - Comprehensive SOLID Architecture Guide

## Purpose  
This guide ensures that any generated code for the Fizzi Challenger banking app conforms to all five SOLID principles—including responsibility/extension boundaries, interface design, dependency inversion, and indirect testing strategies. Give this file to any Copilot agent working on your app.

---

## 1. Single Responsibility Principle (SRP)
**Each module/class/service should have ONE clear responsibility and reason to change.**

**In Fizzi Challenger:**
- Separate services for Auth, Transfers, Account Management, Limits, Statements, Messaging, Profile, Security, and Audit.
- Keep UI logic, database, and domain logic as distinct files/components.

**Checklist:**
- [ ] Each service concerns only one domain (e.g., Auth, Transfer, Notifications).
- [ ] Service method signatures and class names are explicit and descriptive.
- [ ] No service handles both data access and business logic.
- [ ] Tests cover each responsibility independently.

---

## 2. Open/Closed Principle (OCP)  
**Entities are open for extension, but closed for modification.**

**In Fizzi Challenger:**
- Use interfaces/abstract classes for NotificationChannel, PaymentProcessor, ExternalAccountProvider, and LimitTierPolicy.
- Add new behaviors by creating new implementations—never by modifying the consuming code.

**Checklist:**
- [ ] All extension points use interfaces (or abstract classes).
- [ ] Adding Stripe, Plaid, WhatsApp, or a new account tier requires **only** a new implementation, not changes to core classes.
- [ ] No `if`/`switch` statements for provider selection.

**TypeScript example:**
```typescript
interface NotificationChannel {
  send(message: NotificationMessage): Promise<SendResult>;
}
class EmailNotificationChannel implements NotificationChannel { /* ... */ }
class SMSNotificationChannel implements NotificationChannel { /* ... */ }
class WhatsAppNotificationChannel implements NotificationChannel { /* ... */ }
```
---

## 3. Liskov Substitution Principle (LSP)
**Subtypes must be substitutable for their base types without breaking contracts.**

**In Fizzi Challenger:**
- All implementations (e.g., LimitTierPolicy) must behave identically from caller perspective.
- No implementation should throw unexpected exceptions or return incompatible types.

**Checklist:**
- [ ] All interface implementations return identical types (same error/result shape).
- [ ] Behavioral contracts are documented and tested.
- [ ] Callers never need to check for the implementation type.

---

## 4. Interface Segregation Principle (ISP)
**No client should be forced to depend on methods it does not use. Split large interfaces into focused ones.**

**In Fizzi Challenger:**
- Granular interfaces for TransactionInitiator, TransactionApprover, WorkspaceManager, ProfileManager, AccountReader, etc.
- User roles (admin, bookkeeper, ops) should map to interface combinations.

**Checklist:**
- [ ] Interfaces reflect single capabilities (3-5 methods max).
- [ ] Classes only implement interfaces they need.
- [ ] No class has empty methods to satisfy inheritance.

---

## 5. Dependency Inversion Principle (DIP)
**High-level modules depend on abstractions, not on concretions. Both layers depend on interfaces. Use dependency injection.**

**In Fizzi Challenger:**
- Services (e.g., TransferOrchestrator) take interfaces in constructor, never instantiate dependencies.
- Provide environment-specific adapters via a DI container.

**Checklist:**
- [ ] All service dependencies are injected via constructor.
- [ ] No `new` keyword for adapters inside services.
- [ ] Tests swap concrete implementations with mocks as needed.
- [ ] DI container wires everything.

**TypeScript example:**
```typescript
class TransferOrchestrator {
  constructor(
    private paymentProcessor: IPaymentProcessor,
    private limitsEvaluator: ILimitsEvaluator,
    private accountRepository: IAccountRepository,
    private notificationService: INotificationService
  ) {}
}
```

---

## Folder Structure Example  
Conforms to SOLID and project guidelines.

```
src/
├── domain/
│   ├── interfaces/
│   ├── entities/
│   ├── value-objects/
│   └── errors/
├── services/
├── adapters/           (all concrete providers)
├── infra/
├── middleware/
├── routes/
├── di/
│   └── ServiceContainer.ts
└── app.ts
```

---

## Copilot Usage Instructions

When using Copilot or requesting a coding agent to generate code:
- Attach this file and require strict adherence to the outlined practices.
- Instruct agents to create/modify folders and files according to the "Folder Structure Example".
- Ask agents to fill in implementation checklists as code is developed.
- Use dependency injection and interface-first design in all TypeScript/Node/Angular code.

---

## Testing Template

```typescript
class MockPaymentProcessor implements IPaymentProcessor { /* ... */ }
class MockLimitsEvaluator implements ILimitsEvaluator { /* ... */ }
describe('TransferOrchestrator', () => {
  it('should submit transfer', async () => {
    const orchestrator = new TransferOrchestrator(
      new MockPaymentProcessor(),
      new MockLimitsEvaluator(),
      new MockAccountRepository(),
      new MockNotificationService()
    );
    // ... test code
  });
});
```

---

## Quick Checklist for Copilot/Agents

1. Does this class/service have ONE responsibility? (SRP)
2. Are all extension points interface-based? (OCP)
3. Are all implementations substitutable? (LSP)
4. Are interfaces small, not overly broad? (ISP)
5. Is dependency inversion enforced via DI? (DIP)
6. Is folder structure consistent with this guide?
7. Are adapters and domain separated?
8. Are dependencies injected and mockable for tests?
9. Are error cases and contracts clearly documented?

---

## References
- [SOLID Principles – GeeksforGeeks](https://www.geeksforgeeks.org/system-design/solid-principle-in-programming-understand-with-real-life-examples/)
- Fizzi Challenger PRD: `docs/Fizzi_Challenger_PRD.md`
- Architecture Overview: `docs/architecture/overview.md`