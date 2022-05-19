const { graphql, buildSchema } = require('graphql')

const model = require('./model') //Database

const grafojason = require('./my-graph.json')

let DB
model.getDB().then(db => {DB=db})

const ObjectId = require('bson-objectid')

const sse  = require('./utils/notifications') //Notifications
sse.start()

const schema = buildSchema(`
  type Query {
    hello: String
    grafojson: String
    users: [User]
    post: [Post]
    song: [Song]
    comment:[Comment]
    logUser(email:String!,passwd:String!):[User]
    searchUser(name:String!): [User]  
    searchPost(title:String!):[Post]
    searchPostAuthor(author:String!):[Post]
    searchSong(title:String!):[Song]
    searchSongGender(gender:String!):[Song]
    searchSongAuthor(author:String!):[Song]
  }
  type Mutation {
    addUser(name:String!,email:String!,passwd:String!):User!
    deleteUser(name:String!):User!
    addPost(title:String!,author: String!,gender:String,content:String!):Post!
    deletePost(title:String!):Post!
    addComment(author:String!,content:String!,songTitle:String):Comment!
    deleteComment(_id:ID!):Comment!
    addSong(title:String!,author:String!,gender:String!,album:String!):Song!
    deleteSong(title:String!):Song!
    
  }
  type User{
    _id: ID
    name: String
    passwd: String
    email: String
  }

  type Song{
	  _id: ID
	  title: String
    author: String
    gender: String
    album: String
  }
  type Comment{
    _id: ID
    content: String
    song: Song
    author: User
  }
  type Post{
    _id: ID
	  title: String
	  author: User
    gender: String
    content: String
    comment: [Comment]
  }
`)


const rootValue = {
  hello: () => "Bienvenido a MusicDation",
  users: () => DB.objects('User'),
  post: () => DB.objects('Post'),
  song: () => DB.objects('Song'),
  comment:()=> DB.objects('Comment') ,
  grafojson: () => {return JSON.stringify(grafojason)},

  /**************************************************************************/
  logUser: ({email, passwd}) => {
    return DB.objects('User').filter(x=> x.email == email && x.passwd == passwd)
  },
  searchUser: ({name}) => {
    return DB.objects('User').filter(x => x.name== name)
  },


  searchPost: ({title}) => {
    return DB.objects('Post').filter(x => x.title == title )
  },
  searchPostAuthor: ({author}) => {
    return DB.objects('Post').filter(x => x.author == author )
  },
  searchSong: ({title}) => {
    return DB.objects('Song').filter(x => x.title == title)
  },
  searchSongGender: ({gender}) => {
    return DB.objects('Song').filter(x => x.gender == gender )
  },
  searchSongAuthor: ({author}) => {
    return DB.objects('Song').filter(x => x.author == author)
  },
  /**************************Mutation**********************************/
  addUser: ({ name, passwd, email}) => {
    if(name.length > 0 && passwd.length>0 && email.length >0){
    data = { 
      _id: ObjectId(),
       _partition: model.partitionKey,
      name: name, 
      passwd: passwd, 
      email: email 
    }
    DB.write(() => { DB.create('User', data) })
    sse.emitter.emit('new-user', user)
  }
  if (data)  return data
  },

  deleteUser: ({name}) => {
    return DB.write(() => {DB.delete(DB.objects('User').filter(x=>x.name==name))})
  },


  addPost: ({ title, author, gender,content}) => {
    let author1 = DB.objects('User').filter(x => x.name == author)
      if(title!=null && content.length >0){
      data = { 
        _id: ObjectId(),
        _partition: model.partitionKey,
        title: title, 
        author: author1[0], 
        gender: gender,
        content: content,
        comment: new Array()
      }
      DB.write(() => { DB.create('Post', data) })
      sse.emitter.emit('new-post', post)
    }
      return data
    },
  
 
  deletePost: ({title}) => {
    return DB.write(() => {DB.delete(DB.objects('Post').filter(x=>x.title==title))})
  },

  addComment:({author,content,songTitle})=>{
    
    let author1 = DB.objects('User').filter(x => x.name == author)
    let song1 = DB.objects('Song').filter(x => x.title == songTitle)
    if (author != null) {
      data = {
        _id: ObjectId(),
        _partition: model.partitionKey,
        author: author1[0],
        content: content,
        song: song1[1]
    }
    DB.write(() => { DB.create('Comment', data) })
    sse.emitter.emit('new-comment', comment)
    }
    return data
  },

  deleteComment:({_id})=>{
    return DB.write(() => {DB.delete(DB.objects('Comment').filter(x=>x._id==_id))})
  },

  addSong:({title,author,gender,album})=>{
    if (title != null) {
      data = {
        _id: ObjectId(),
        _partition: model.partitionKey,
        author: author,
        title: title,
        gender: gender,
        album: album
      }
      DB.write(() => { DB.create('Song', data) })
      sse.emitter.emit('new-song', song)
  }
  return data
},

  deleteSong:({title})=>{
    return DB.write(() => {DB.delete(DB.objects('Song').filter(x=>x.title==title))})
  },
}
console.log(grafojason)
exports.root   = rootValue
exports.schema = schema
exports.sse    = sse
