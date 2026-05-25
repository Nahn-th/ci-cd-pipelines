// File test cơ bản để đảm bảo CI/CD Pipeline hoạt động
describe('DevOps CI/CD Pipeline Sanity Check', () => {
  it('should pass this dummy test to verify CI/CD flow', () => {
    expect(1 + 1).toBe(2);
  });

  it('pass this test to verify CI/CD', () => {
    expect(1 + 2).toBe(3);
  });

  it('pass this test to ok', () => {
    expect(2 + 2).toBe(4);
  });
});
