import React from 'react';
import Post from './Post';

const Reel = props => {
  let {updateReel, handleDelete, currentUser, reelPosts} = props;
  //console.log(props.reelPosts.map(post => post.title))
  //console.log(props.reelPosts.map(post => post.id))
  //console.log(currentUser)
  return (
    <main>
      {props.reelPosts && props.reelPosts.map(post => (
        <Post
          publicId={post.publicId}
          postId={post.id}
          title={post.title}
          userId={post.userId}
          description={post.description}
          handleDelete={handleDelete}
        />
      ))}
    </main>
  );
};

export default Reel;
