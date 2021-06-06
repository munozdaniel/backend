import mongoose from 'mongoose';
const postSchema = new mongoose.Schema({
    author: {
        ref: 'User',
        type: mongoose.Schema.Types.ObjectId,
    },
    content: String,
    title: String,
});
const postModel = mongoose.model('Post', postSchema);
export default postModel;
//# sourceMappingURL=post.model.js.map