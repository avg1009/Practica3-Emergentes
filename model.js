const Realm = require('realm')
const ObjectId = require('bson-objectid')

//const app = new Realm.App({ id: "application-0-qefdz" })
const app = new Realm.App({ id: "application-0-vgnpu" })

let UserSchema = {
  name: 'User',
  primaryKey: '_id',
  properties: {
    _id: 'objectId',
    _partition: 'string',
    name: 'string',
    passwd: 'string',
    email: 'string',
    
  }
}
let SongSchema = {
  name: "Song",
  primaryKey: '_id',
  properties: {
    _id: 'objectId',
    _partition: 'string',
    title: 'string',
    author: 'string',
    gender: 'string',
    album: 'string'
  }
}
let CommentSchema = {
  name: "Comment",
  primaryKey: '_id',
  properties: {
    _id: 'objectId',
    _partition: 'string',
    content: 'string',
    song: 'Song',
    author: 'User'
  }
}
let PostSchema = {
  name: 'Post',
  primaryKey: '_id',
  properties: {
    _id:'objectId',
    _partition: 'string',
    title: 'string',
    content: 'string',
    author: 'User',
    gender: 'string',
    comment: 'Comment[]',
  }
}


const myPartitionKey = "myAppPartition"

let sync = { user: app.currentUser, partitionValue: myPartitionKey}


let config = {
  path: './data/MusicDation.realm',
  sync: sync,
  schema: [UserSchema,SongSchema,CommentSchema,PostSchema ]
}

exports.getDB = async () => {
  await app.logIn(new Realm.Credentials.anonymous())
  return await Realm.open(config)
}
exports.partitionKey = myPartitionKey

exports.app = app
// // // // // 

if (process.argv[1] == __filename) { //TESTING PART

  if (process.argv.includes("--create")) { //crear la BD

    Realm.deleteFile({path: './data/MusicDation.realm'}) //borramos base de datos si existe
    app.logIn(new Realm.Credentials.anonymous()).then(() => {
      let DB = new Realm({
        path: './data/MusicDation.realm',
        sync: sync,
        schema: [UserSchema,SongSchema,CommentSchema,PostSchema ]
      })

      DB.write(() => {

        let user = DB.create('User', {  
                                        _id: ObjectId(), 
                                        _partition:myPartitionKey, 
                                        name: 'user0',
                                        passwd: 'xxx',
                                        email: 'user0@gmail.com'
          
        })

        let song = DB.create('Song', {
          _id: ObjectId(), 
          _partition:myPartitionKey, 
                                        title: 'Forbbiden Voice',
                                        author: 'Martin Garrix',
                                        gender: 'electronica',
                                        album: 'None'
        })
        let comment = DB.create('Comment', {
          _id: ObjectId(), 
          _partition:myPartitionKey, 
                              
                                        content: 'Buena',
                                        song: song,
                                        author: user
        })
        let post = DB.create('Post', {
          _id: ObjectId(), 
          _partition:myPartitionKey, 
                                        title: 'Primer Post',
                                        content: 'esto es una prueba de post',
                                        author: user,
                                        gender: 'Rock',
                                        comment: [comment],
                                        
        })
        console.log('Inserted objects', user, song, comment, post)
      })
      DB.close()
  })
  .catch(err => console.log(err))
  } else { //consultar la BD

    Realm.open({
      path: './data/MusicDation.realm',
      schema: [UserSchema,SongSchema,CommentSchema,PostSchema ]
    }).then(DB => {
      let users = DB.objects('User')
      users.forEach(x => console.log(x.name, x._id))
      let song = DB.objects('Song')[0]
      if (song)
        console.log(song.title, 'by: ', song.author)
      DB.close()
    })
  }

}