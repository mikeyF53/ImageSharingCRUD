const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('morgan');
const { Router } = require('express');
const { hash, compare, encode, verify, restrict, checkAccess } = require('./auth');
const { Post, User, Comment, Like } = require('./models');

// allow the port to be defined with an env var or a dev value
const PORT = process.env.PORT || 3000;

// after importing middleware define app and mount them
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(logger('dev'));

// mount route handlers
// --> create user
app.post('/users', async (req, res) => {
  try {
    let {name, password, email, bio, pro_pic} = req.body;
    console.log(name, password, email)
    let password_digest = await hash(password);
    const createUser = await User.create({
      name,
      password_digest,
      email,
      bio,
      pro_pic
    })
    let token = await encode(createUser.dataValues)
    res.json([token,createUser.dataValues]);
  } catch (e) {
    console.error(e);
  }
})
// --> login user
app.post('/users/login', async (req, res) => {
  try {
    let {password} = req.body;
    const loginUser = await User.findOne({
      where: {
        email: req.body.email
      }
    });
    let {password_digest} = loginUser;
    let verify = await compare(password, password_digest);
    if (verify) {
      let token = await encode(loginUser.dataValues)
      res.json([token,loginUser.dataValues]);
    } else {
      res.status(403)
    }
  } catch (e) {
    res.status(404).send(e.message)
  }
})
// --> user profile page <--- this path is now subsumed in get "users/:id/posts" which returns both a profile and images
  /*app.get('/users', async (req, res) => {
    try {

    } catch (e) {

    }
  })*/
  // --> get ALL users
    app.get('/allusers', restrict, async (req, res) => {
      try {
        let resp = await User.findAll();
        res.json(resp.map(user => user.dataValues));
      } catch (e) {
        res.status(403);
      }
    });
// --> edit profile page
app.put('/users/:id', restrict, checkAccess, async (req, res) => {
  try {
    let {name, bio, email, pro_pic} = req.body;
    const userProfile = await User.findByPk(req.params.id);
    let selectedProfile = await userProfile.update({name, bio, email, pro_pic});
    res.json(selectedProfile);
  } catch (e) {
    res.status(403)
  }
});
// --> create post
app.post('/users/:id/posts', restrict, checkAccess, async (req, res, next) => {

  try {
    let {title, description, publicId} = req.body
    const userId = req.params.id;
    const createPost = await Post.create({
      title, description, publicId, userId
    })
    console.log(title, userId)
    let selectedUser = await User.findOne({
      where: {
        id: userId
      }
    })
    let resp = await createPost.setUser(selectedUser)
    res.json(resp)
  } catch (e) {
    next(e)
  }
})
// --> show one user's profile & posts
app.get('/users/:id/posts', restrict, checkAccess, async (req, res, next) => {
  try {
    let {id} = req.params;
    console.log(req);
    const userPosts = await Post.findAll({
      where: {
        user_id: id
      }
    })
    let selectedUser = await User.findOne({
      where: {
        id
      }
    })
    res.json([userPosts,selectedUser])
  } catch (e) {
    next(e)
  }
})
// --> edit posts (tentatively done)

app.put('/users/:id/posts/', restrict, checkAccess, async (req, res) => {
  let {id, title, description, publicId} = req.body;
  try {
    const userPost = await Post.findByPk(id);
    let updatedPost = await userPost.update({title,description,publicId});
    res.json(updatedPost);
  } catch (e) {
    res.status(403)
  }
})
// --> delete posts (tentatively done)
app.delete('/users/:id/posts/:post_id', restrict, checkAccess, async (req, res) => {
  try {
    const userPost = await Post.findByPk(req.params.post_id)
    userPost.destroy();
    res.status(200).send(`Deleted post with id ${req.params.post_id}`)
  } catch (e) {
    res.status(403).send(e.message);
  }
})
// Get Posts from All Users
app.get('/posts', restrict, async (req, res) => {
  try {
    const posts = await Post.findAll();
    res.json(posts);
  } catch (e) {
    res.status(403).send(e.message);
  }
});

//make a Comment
app.post('/comment/users/:id/posts/:post_id', restrict, checkAccess, async (req, res) => {
  try {
    const {text} = req.body;
    console.log(text);
    console.log(req.params.id);
    console.log(req.params.post_id);
    const resp = await Comment.create({
      text: text,
      userId: req.params.id,
      postId: req.params.post_id
    });
    res.json(resp);
  } catch(e) {
    console.error(e);
    res.status(403);
  }
})

//make a like
app.post('/like/users/:id/posts/:post_id', restrict, checkAccess, async (req, res) => {
  try {
    const resp = await Like.create(
      {userId: req.params.id,
      postId: req.params.post_id});
    res.json(resp);
  } catch(e) {
    console.error(e);
    res.status(403);
  }
});

//get comments for a post
app.get('/post/:post_id/comments', restrict, async (req, res) => {
  try {
    const postComments = await Comment.findAll({where:{postId: req.params.post_id}});
    res.json(postComments);
  } catch(e) {
    console.error(e);
    res.status(403);
  }
});

//get likes for a post
app.get('/post/:post_id/likes', restrict, async (req, res) => {
  try {
    const postLikes = await Like.findAll({where: {postId: req.params.post_id}})
    res.json(postLikes);
  } catch(e) {
    console.error(e);
    res.status(403);
  }
});

//get likes for a user
app.get('/users/:id/likes', restrict, async (req, res) => {
  try {
    const likes = await Like.findAll({where: {userId: req.params.id}});
    res.json(likes);
  } catch(e) {
    console.error(e);
    res.status(403);
  }
})


//get user info
app.get('/users/:id', restrict, async (req, res) => {
  try {
    let selectedUser = await User.findOne({
      where: {
        id: req.params.id
      }
    });
    res.json(selectedUser);
  } catch(e) {
    console.error(e);
    res.status(403);
  }
});


// generic "tail" middleware for handling errors
app.use((e, req, res, next) => {
  console.log(e);
  res.status(404).send(e.message);
});

// bind app to a port
app.listen(PORT, () => console.log(`up and running on port ${PORT}`));
