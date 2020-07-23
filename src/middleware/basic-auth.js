const bcrypt = require('bcryptjs');

function requireAuth(req, res, next) {
  let basicToken;
  const authToken = req.get('Authorization') || '';
  console.log(authToken, 'out');

  if (!authToken.toLowerCase().startsWith('basic ')) {
    console.log(authToken, 'in');
    return res.status(401).json({ error: 'Missing basic token' });
  } else {
    basicToken = authToken.slice('basic '.length, authToken.length);
  }

  const [tokenUserName, tokenPassword] = Buffer
    .from(basicToken, 'base64')
    .toString()
    .split(':');

  if (!tokenUserName || !tokenPassword) {
    return res.status(401).json({ error: 'Unauthorized request' });
  }

  req.app.get('db')('blogful_users')
    .where({ user_name: tokenUserName })
    .first()
    .then(user => {
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized request' });
      }
      return bcrypt.compare(tokenPassword, user.password)
        .then(passwordsMatch => {
          if (!passwordsMatch) {
            return res.status(401).json({ error: 'Unauthorized request' });
          }
          req.user = user;
          next();
        });
    })
    .catch(next);
}

module.exports = {
  requireAuth,
};