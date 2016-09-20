#!/usr/bin/perl

use strict;
use warnings;
     
my $filename = '/tmp/openvpn.txt';
open(my $fh, '>', $filename) or die "Could not open file '$filename' $!";
print $fh "My first report generated by perl\n";

my $key;

foreach $key (keys(%ENV)) {
    print $fh ("$key $ENV{$key}\n");
}

close $fh;
print "done\n";