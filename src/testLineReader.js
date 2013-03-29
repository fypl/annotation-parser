var lr=require('./lineReader');
var path='../doc/atomic/AtomicBoolean.java';
var sep='\n';
var reader=lr(path,'utf8',sep);
while(reader.hasNextLine()){
	console.log(reader.nextLine());
}