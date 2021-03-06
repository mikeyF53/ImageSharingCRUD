import React, { Component } from 'react';
import './App.css';
import { Route, Redirect } from 'react-router-dom';
import {
  uploadPhoto,
  createUser,
  loginUser,
  getAllPosts,
  editPost,
  editUser
} from './services/services';
import Nav from './components/Nav';
import Login from './components/Login';
import Register from './components/Register';
import Reel from './components/Reel';
import Footer from './components/Footer';
import PostForm from './components/PostForm';
import Hero from './components/Hero';
import Profile from './components/Profile';

class App extends Component {
  constructor() {
    super();
    this.state = {
      authToken: '',
      currentUser: {
        publicId: ''
      },
      filepath: '',
      isLoggedIn: false,
      redirected: false,
      userForm: {
        //this no longer needs passed to register
        name: '',
        email: '',
        password: ''
      },
      reelPosts: [],
      currentPost: {},
      profileForm: {},
      homeMsg: 'Welcome to PostPic, where you can post a pic!',
    };
    this.handleUpload = this.handleUpload.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleEditChange = this.handleEditChange.bind(this);
    this.handleEditSubmit = this.handleEditSubmit.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.updateReel = this.updateReel.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleRegister = this.handleRegister.bind(this);
    this.setCurrentPost = this.setCurrentPost.bind(this);
    this.handleRedirect = this.handleRedirect.bind(this);
    this.loginErrorMessage = this.loginErrorMessage.bind(this);
    this.handleEditProfChange = this.handleEditProfChange.bind(this);
    this.handleEditProfSubmit = this.handleEditProfSubmit.bind(this);
    this.setProfileForm = this.setProfileForm.bind(this);
  }

  updateReel(post) {
    this.setState(prevState => ({
      ...prevState,
      reelPosts: [
        post,
        ...prevState.reelPosts
      ]
    }));
  }

  handleRedirect() {
    this.setState(prevState => ({
      ...prevState,
      redirected: true
    }));
    return <Redirect to='/' />;
  }

  handleDelete(postId) {
    this.setState(prevState => ({
      ...prevState,
      reelPosts: prevState.reelPosts.filter(post => !(post.id === postId))
    }));
  }

  async loadReel() {
    const reelPosts = await getAllPosts();
    this.setState({
      reelPosts,
    });
  }

  async componentDidMount() {
    const reelPosts = await getAllPosts();
    this.setState({
      reelPosts
    });

    if (localStorage.getItem('token')) {
      this.setState({
        authToken: localStorage.getItem('token')
      });
      if (localStorage.getItem('user')) {
        this.setState({
          currentUser: JSON.parse(localStorage.getItem('user')),
          isLoggedIn: true
        });
      }
    } else {
      this.setState({
        isLoggedIn: false,
        redirect: false
      });
    }
  }

  async handleUpload(e) {
    e.preventDefault();
    let { filepath } = this.state;
    let resp = await uploadPhoto(filepath);
    console.log(resp);
    return resp;
  }

  handleChange(e) {
    const { name, value } = e.target;
    this.setState(prevState => ({
      ...prevState,
      homeMsg: 'Welcome to PostPic, where you can post a pic!',
      userForm: {
        ...prevState.userForm,
        [name]: value
      }
    }));
  }

  handleEditChange(e) {
    const { name, value } = e.target;
    this.setState(prevState => ({
      ...prevState,
      currentPost: {
        ...prevState.currentPost,
        [name]: value
      }
    }));
  }
  handleEditProfChange(e) {
    const { name, value } = e.target;
    this.setState(prevState => ({
      ...prevState,
      profileForm: {
        ...prevState.profileForm,
        [name]: value
      }
    }));
  }
  async handleEditProfSubmit() {
    const userEdit = await editUser(this.state.currentUser.id, {
      ...this.state.currentUser,
      ...this.state.profileForm
    });
    this.setState({
      currentUser: userEdit
    });
  }

  async handleEditSubmit() {
    const newPost = await editPost(
      this.state.currentUser.id,
      this.state.currentPost
    );
    this.updateReel(newPost);
  }

  setCurrentPost(post) {
    this.setState({
      currentPost: post
    });
  }
  setProfileForm(user) {
    this.setState({
      profileForm: {
        name: user.name,
        bio: user.bio
      }
    });
  }

  async handleLogin(e) {
    e.preventDefault();
    try {
      const { email, password } = this.state.userForm;
      console.log(this.state.userForm);
      const resp = await loginUser({
        email,
        password
      });
      console.log(resp[0]);
      console.log(resp[1]);
      if (resp !== null) {
        localStorage.setItem('token', resp[0]);
        localStorage.setItem('user', JSON.stringify(resp[1]));
        this.setState(prevState => ({
          isLoggedIn: true,
          authToken: resp[0],
          currentUser: resp[1],
          userForm: {
            ...prevState.userForm,
            email: '',
            password: ''
          }
        }));
        await this.loadReel();
      }
    } catch (error) {
      this.loginErrorMessage();
      console.log(error);
    }
  }

  loginErrorMessage() {
    const msg = 'You are not registerd or have entered incorrect credentials';
    console.log(msg);
    this.setState({
      homeMsg: msg
    });
  }

  async handleRegister(token, currentUser) {
    this.setState(prevState => ({
      ...prevState,
      authToken: token,
      currentUser: currentUser,
      isLoggedIn: true
    }));
    await this.loadReel();
  }

  handleLogout(e) {
    e.preventDefault();
    console.log('User has been logged out');
    localStorage.removeItem('token');
    this.setState({
      isLoggedIn: false,
      redirected: false,
      currentUser: {
        publicId: ''
      }
    });
  }

  async handleSubmit(e) {
    e.preventDefault();
    //name email password bio pro_pic
    const userData = { ...this.state.userForm };
    const resp = await createUser(userData);

    localStorage.setItem('token', resp[0]);
    localStorage.setItem('user', JSON.stringify(resp[1]));

    this.setState(prevState => ({
      ...prevState,
      userForm: {
        ...prevState.userForm,
        name: '',
        email: '',
        password: ''
      },
      isLoggedIn: true,
      authToken: resp[0],
      currentUser: resp[1]
    }));
    console.log(resp);
  }

  render() {
    return (
      <div className='App'>
        <Nav
          proPic={this.state.currentUser.pro_pic}
          isLoggedIn={this.state.isLoggedIn}
          handleLogout={this.handleLogout}
          currentUser={this.state.currentUser}
        />

        {this.state.isLoggedIn && this.state.redirected === false
          ? this.handleRedirect()
          : null}

        <Hero homeMsg={this.state.homeMsg} isLoggedIn={this.state.isLoggedIn} />

        {!this.state.isLoggedIn && (
          <>
            <Route
              exact
              path='/login'
              render={() => (
                <Login
                  userForm={this.state.userForm}
                  handleChange={this.handleChange}
                  handleLogin={this.handleLogin}
                  isLoggedIn={this.state.isLoggedIn}
                />
              )}
            />
            <Route
              exact
              path='/register'
              render={() => (
                <Register
                  userForm={this.state.userForm}
                  handleChange={this.handleChange}
                  handleSubmit={this.handleSubmit}
                  handleRegister={this.handleRegister}
                  isLoggedIn={this.state.isLoggedIn}
                />
              )}
            />
          </>
        )}

        {this.state.isLoggedIn && (
          <>
            <Route
              path='/users/:id'
              render={props => (
                <Profile
                  profileForm={this.state.profileForm}
                  handleEditProfSubmit={this.handleEditProfSubmit}
                  handleEditProfChange={this.handleEditProfChange}
                  currentUser={this.state.currentUser}
                  setProfileForm={this.setProfileForm}
                />
              )}
            />
            <PostForm
              updateReel={this.updateReel}
              currentUser={this.state.currentUser}
            />
            <Route
              exact
              path='/'
              render={props => (
                <Reel
                  currentUser={this.state.currentUser}
                  reelPosts={this.state.reelPosts}
                  handleDelete={this.handleDelete}
                  handleEditChange={this.handleEditChange}
                  handleEditSubmit={this.handleEditSubmit}
                  setCurrentPost={this.setCurrentPost}
                  currentPost={this.state.currentPost}
                  allUsers={this.state.allUsers}
                />
              )}
            />
            <Route
              path='/users/:id'
              render={props => {
                const userReel = this.state.reelPosts.filter(
                  post => (post.userId === parseInt(props.match.params.id))
                );
                return (
                  <Reel
                    {...props}
                    currentUser={this.state.currentUser}
                    reelPosts={userReel}
                    handleDelete={this.handleDelete}
                    handleEditChange={this.handleEditChange}
                    handleEditSubmit={this.handleEditSubmit}
                    setCurrentPost={this.setCurrentPost}
                    currentPost={this.state.currentPost}
                  />
                );
              }}
            />
          </>
        )}

        <Footer />
      </div>
    );
  }
}

export default App;
