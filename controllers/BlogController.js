const blogsRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const Blog = require('../models/Blog')
const User = require('../models/User')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
    return response.json(blogs.map(blog => blog.toJSON()))
})

blogsRouter.post('/', async (request, response) => {
    const decodedToken = jwt.verify(request.token, process.env.SECRET) 
    if (!request.token || !decodedToken.id) {
        return response.status(401).json({ error: "Missing or invalid token." })
    }
    const user = await User.findById(decodedToken.id)

    const newBlog = {
        title: request.body.title,
        author: request.body.author,
        url: request.body.url,
        likes: request.body.likes | 0,
        user: user._id
    }

    if(!newBlog.title || !newBlog.url) {
        return response.status(400).end()
    }
    const blog = new Blog(newBlog)

    const sentBlog = await blog.save()

    user.blogs = user.blogs.concat(sentBlog._id)
    await user.save()

    return response.status(201).json(sentBlog).end()
})

blogsRouter.delete('/:id', async (request, response) => {
    const decodedToken = jwt.verify(request.token, process.env.SECRET)
    if(!request.token || !decodedToken.id){
        return response
          .status(401)
          .json({ error: 'Missing or invalid token.' })
    }
    
    const blog = await Blog.findById(request.params.id)

    if (!blog) {
        response.status(400).end()
    }

    if(blog.user.toString() === decodedToken.id.toString()) {
        await Blog.findByIdAndDelete(request.params.id)
        response.status(204).end()
    } else {
        response.status(403).json({ error: 'operation not allowed.'})
    }
})

blogsRouter.put('/:id', async (request, response) => {
    const updatedBlog = {
        title: request.body.title,
        author: request.body.author,
        url: request.body.url,
        likes: request.body.likes
    }

    const blog = await Blog.findByIdAndUpdate(request.params.id, updatedBlog, { new: true })
    if (blog) {
        response.json(blog.toJSON());
    } else {
        response.status(400).end() 
    }
})

module.exports = blogsRouter
