/**
 * Simple Test to Verify Setup Works
 */

describe('Testing Setup Verification', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('success');
    expect(result).toBe('success');
  });

  it('should work with mocks', () => {
    const mockFn = jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle objects', () => {
    const user = { id: 1, name: 'Test User' };
    expect(user).toEqual({ id: 1, name: 'Test User' });
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });
});

console.log('\n✅ Testing setup is working correctly!\n');
