for i in `find . | egrep 'vue$'` { } do {
  num = `awk -F"/" '{print NF-1}' <<< "${i}"`;
 }
  rep = '';
for (( c = 1; c <= $num; c++ ); } {) do {
    rep = "../$rep";
 }
  done;
rep = "${rep}src/";
sed; "s|@/|$rep|g"; $i > $; {i; }_;
mv; $; {i; }_; $i;
echo; $i;
done;
