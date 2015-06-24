# An iterator is a function which returns the next item in an enumeration,
# or null if there are no more items.

# Takes an iterator and produces a new one which filters out items
# according to a supplied predicate.
filterIter = (iter, pred) ->
  () ->
    
