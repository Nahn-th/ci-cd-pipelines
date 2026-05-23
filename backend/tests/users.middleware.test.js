const { auth } = require('../middlewares/users.middleware');
const jwt = require('jsonwebtoken');
const { blacklist } = require('../blacklist');

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('Auth Middleware - Unit Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Reset req, res, next before each test
    req = {
      headers: {},
      body: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
    
    // Clear blacklist before each test to prevent test cross-contamination
    blacklist.length = 0;
    
    // Clear all mocks
    jest.clearAllMocks();
  });

    
  // Test 10: No Token Provided
    
  test('10. should return 401 and "Please Login" if no authorization header is provided', () => {
    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Please Login' });
    expect(next).not.toHaveBeenCalled();
  });

  test('11. should return 401 and "Please Login" if authorization header does not contain a token', () => {
    req.headers.authorization = '';
    
    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Please Login' });
    expect(next).not.toHaveBeenCalled();
  });

    
  // Test 12: Blacklisted Token
    
  test('12. should return 401 and "Please Login Again" if the token is blacklisted', () => {
    const mockToken = 'blacklisted-token-abc';
    req.headers.authorization = `Bearer ${mockToken}`;
    blacklist.push(mockToken);

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Please Login Again' });
    expect(next).not.toHaveBeenCalled();
  });

    
  // Test 13: Invalid Token (throws error)
    
  test('13. should return 400 with error message if jwt.verify throws an error', () => {
    const mockToken = 'invalid-token';
    req.headers.authorization = `Bearer ${mockToken}`;
    
    jwt.verify.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    auth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'SRM');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ msg: 'jwt expired' });
    expect(next).not.toHaveBeenCalled();
  });

    
  // Test 14: Valid Token
    
  test('14. should call next() and populate req.body and req.user with decoded data when token is valid', () => {
    const mockToken = 'valid-token';
    req.headers.authorization = `Bearer ${mockToken}`;
    
    const mockDecoded = {
      user: 'johndoe',
      userId: 'user123',
      role: 'student'
    };
    
    jwt.verify.mockReturnValue(mockDecoded);

    auth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'SRM');
    
    // Verify properties bound to req.body
    expect(req.body.username).toBe('johndoe');
    expect(req.body.userId).toBe('user123');
    expect(req.body.role).toBe('student');
    
    // Verify properties bound to req
    expect(req.user).toEqual(mockDecoded);
    expect(req.userId).toBe('user123');
    expect(req.role).toBe('student');
    
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('15. should return 401 if jwt.verify returns falsy value', () => {
    const mockToken = 'falsy-token';
    req.headers.authorization = `Bearer ${mockToken}`;
    
    jwt.verify.mockReturnValue(null);

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: 'not authorized' });
    expect(next).not.toHaveBeenCalled();
  });
});
