import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Post } from "../../type";

interface PostState {
  postList: Post[];
  userPostList: Post[];
}

const initialState: PostState = {
  postList: [],
  userPostList: [],
};

const postSlice = createSlice({
  name: "Posts",
  initialState,
  reducers: {
    setPostList: (state, action: PayloadAction<Post[]>) => {
      state.postList = action.payload;
    },

    setNewPost: (state, action: PayloadAction<Post>) => {
      state.postList.unshift(action.payload);
    },

    setUserPostList: (state, action: PayloadAction<Post[]>) => {
      state.userPostList = action.payload;
    },

   setPostLikeAnUnLike: (state, action) => {
  const { postId, userId } = action.payload;

  const item = state?.postList?.find((p) => p?._id === postId);

  if (item) {
    const alreadyLiked = item.likes.includes(userId);

    if (alreadyLiked) {
      item.likes = item.likes.filter((l) => l !== userId);
    } else {
      item.likes.push(userId);
    }
  }
},

     setPostComment: (state, action) => {
      const { postId, text, userId, fullName } = action.payload;
      const post = state.postList.find(p => p._id === postId);
      if (!post) return;

      const newComment = {
        _id: Date.now().toString(),
        text,
        createdAt: new Date().toISOString(),
        user: {
          user: userId,
          fullName: fullName
        },
      };

      if (!post.comments) post.comments = [];
      post.comments.push(newComment);
    },

    setPostLikeAnUnLikeComment: (state, action) => {
      // Implementation for comment like/unlike
    },

    setPostReplyComment: (state, action) => {
      const { postId, commentId, text, userId, fullName } = action.payload;
      const post = state.postList.find(p => p._id === postId);
      if (!post) return;
      const comment = post.comments.find(c => c._id === commentId);
      if (!comment) return;
      const newReply = {
        _id: Date.now().toString(),
        text,
        createdAt: new Date().toISOString(),
        user: {
          user: userId,
          fullName: fullName
        },
      };
      if (!comment.replies) comment.replies = [];
      comment.replies.push(newReply);
    },

    setDeletePostFromList: (state, action: PayloadAction<{ postId: string; userId: string }>) => {
      // Implementation for deleting post
    },
  },
});

export const { 
  setPostList, 
  setUserPostList, 
  setNewPost,
  setPostLikeAnUnLike, 
  setPostComment, 
  setDeletePostFromList, 
  setPostLikeAnUnLikeComment, 
  setPostReplyComment 
} = postSlice.actions;

export default postSlice.reducer;

