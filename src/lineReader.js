'use strict';

var eol = require('os').EOL, fs = require('fs'), StringDecoder = require('string_decoder').StringDecoder;

/*
 * 同步按行读取文件
 * example:
 * var lineReader = require('./lineReader');
 * var reader = lineReader(fileName, 'utf8', '\n', 1024*8);
 * while(reader.hasNextLine()){
 *     var line = reader.nextLine();
 *     // todo something
 *     if(condition) reader.close();
 * }
 */
module.exports=function(fileName, encoding, separator, bufferSize){
    //参数
	var filePosition    = 0,
        encoding        = encoding || 'utf8',
        separator       = separator || eol,
        separatorLength = separator.length,
        bufferSize      = bufferSize || 1024*8,
        buffer          = new Buffer(bufferSize),
        bufferStr       = '',
        decoder         = new StringDecoder(encoding),
        closed          = false,
        eof             = false,
        separatorIndex  = -1,
        fd              = fs.openSync(fileName, 'r');

    //关闭文件
    function close(){
    	if(!close){
    		fs.close(fd, function(err){
    			if(err) throw err;
    		});
    		close=true;
    	}
    }

    //读取文件到缓存
    function readFile(){
    	var bytesRead=fs.readSync(fd, buffer, 0, bufferSize, filePosition);
    	if(bytesRead<bufferSize){
    		eof=true;
    		close();
    	}
    	filePosition+=bytesRead;
    	bufferStr += decoder.write(buffer.slice(0, bytesRead));
    	if(separatorIndex<0)separatorIndex=bufferStr.indexOf(separator);
    	if(separatorIndex<0 && !eof)readFile();
    }

    //是否有下一行
    function hasNextLine(){
    	return bufferStr.length > 0 || !eof;
    }

    //下一行
    function nextLine(){
    	var line='';
    	if(separatorIndex<0)separatorIndex=bufferStr.indexOf(separator);
    	if(separatorIndex<0){
    		if(eof){
    			if(hasNextLine()){
    				separatorIndex=bufferStr.length;
    				line=getLine();
    			}else{
    				throw new Error('no more lines to read!');
    			}
    		}else{
    			readFile();
    			if(separatorIndex<0){
    				separatorIndex=bufferStr.length;
    			}
    			line=getLine();
    		}
    	}else{
    		line=getLine();
    	}
    	return line;
    }

    //获取行
    function getLine(){
    	var line=bufferStr.substring(0, separatorIndex);
    	bufferStr=bufferStr.substring(separatorIndex+separatorLength);
    	separatorIndex=-1;
    	return line;
    }

    return {'hasNextLine': hasNextLine, 'nextLine': nextLine, 'close': close};
};