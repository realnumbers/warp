#!/bin/sh

split_name(){
	name=${name// - /;}
	read -ra ADDR <<< "$name"
	name_it=${ADDR[0]}
	name_de=${ADDR[1]}
}

split_city(){
	city=${city// - /;}
	read -ra ADDR <<< "$city"
	city_it=${ADDR[0]}
	city_de=${ADDR[1]}
}

add_line(){
	line=${line//" "/""}
	line="[\"${line//"/"/"\", \""}\"]"
  #echo $line
  #export IFS="/"
  #ary=($line)
  #for key in "${!ary[@]}"; do echo "${ary[$key]}"; done
	#export IFS=";"
}

gen_json_de(){
	echo -n "{ 
		\"name\" : \"$name_de\",
		\"id\" : \":$id:\",
		\"x\" : \"$x_coord\",
		\"y\" : \"$y_coord\",
    \"line\" : $line
	}";
}

gen_json_it(){
	echo -n "{ 
		\"name\" : \"$name_it\",
		\"id\" : \":$id:\",
		\"x\" : \"$x_coord\",
		\"y\" : \"$y_coord\",
    \"line\" : $line
	}";
}

parse(){
	export IFS=";"
  first="true";
	cat paline.csv | while read id name y_coord x_coord dummy line ;
	do 
		split_name
		split_city
    add_line
		if [ "$first" != "true" ]; then
			echo "," >> de.json
			echo "," >> it.json
    else
      first="false";
		fi
		gen_json_de >> de.json
		gen_json_it >> it.json
	done
}

TARGET=../app/data/busstops.json
rm $TARGET 
parse
echo "{
	\"de\" : [" >> $TARGET
cat de.json >> $TARGET
echo "], " >> $TARGET
echo "\"it\" : [" >> $TARGET
cat it.json >> $TARGET
echo "" >> $TARGET
echo "]" >> $TARGET
echo "}" >> $TARGET
json-glib-validate $TARGET
rm de.json
rm it.json

