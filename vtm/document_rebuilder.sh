#!/bin/bash
while inotifywait -e modify -e close_write -e create -r ./adoc; do
	asciidoctor ./adoc/*.adoc -D /var/www/html/$1
	asciidoctor-pdf adoc/main.adoc -o pdf/main.pdf
done

