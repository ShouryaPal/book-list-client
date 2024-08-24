import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  FilterFn,
} from "@tanstack/react-table";
import { rankItem } from "@tanstack/match-sorter-utils"; // Importing rankItem for fuzzy filtering
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState, useMemo } from "react";
import useUserStore from "@/hooks/useUserStore";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { AddBookSheet } from "./AddBookSheet";
import { BookDown } from "lucide-react";
import { Toaster, toast } from "sonner";

interface Book {
  _id: string;
  title: string;
  author: string;
  genre: string;
  owner: {
    _id: string;
    username?: string;
  };
}

const fetchBooks = async () => {
  const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/books`);
  return response.data;
};

const fetchOwnerName = async (userId: string) => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/api/user/auth/info/${userId}`
  );
  return response.data.name;
};

const fetchUserBooks = async (userId: string) => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/api/books/user/${userId}`
  );
  return response.data;
};

const initiateExchange = async (exchangeData: {
  requesterId: string;
  requestedBookId: string;
  offeredBookId: string;
}) => {
  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/books/exchange`,
    exchangeData
  );
  return response.data;
};

// Fixed: Properly defining the fuzzyFilter and importing rankItem
const fuzzyFilter: FilterFn<Book> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);
  addMeta({
    itemRank,
  });
  return itemRank.passed;
};

export default function BookTable() {
  const [booksWithOwners, setBooksWithOwners] = useState<Book[]>([]);
  const { user } = useUserStore();
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentBook, setCurrentBook] = useState<Book | undefined>(undefined);
  const [globalFilter, setGlobalFilter] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const queryClient = useQueryClient();
  const [isAddBookSheetOpen, setIsAddBookSheetOpen] = useState(false);

  const {
    data: books = [],
    isLoading: isBooksLoading,
    error: booksError,
  } = useQuery({
    queryKey: ["books", user?._id],
    queryFn: fetchBooks,
    refetchInterval: 5000,
  });

  useEffect(() => {
    const fetchOwners = async () => {
      const updatedBooks = await Promise.all(
        books.map(async (book: Book) => {
          const ownerName = await fetchOwnerName(book.owner._id);
          return { ...book, owner: { ...book.owner, username: ownerName } };
        })
      );
      // Filter out books where the user is the owner
      const filteredBooks = updatedBooks.filter(
        (book) => book.owner.username !== user?.name
      );
      setBooksWithOwners(filteredBooks);
    };

    if (books.length > 0 && user) {
      fetchOwners();
    }
  }, [books, user]);

  const exchangeMutation = useMutation({
    mutationFn: initiateExchange,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setIsDialogOpen(false);
      setSelectedBook(null);
      setCurrentBook(undefined);
      toast.success("Exchange request sent successfully!");
    },
    onError: () => {
      toast.error("Failed to send exchange request. Please try again.");
    },
  });

  const { mutate } = exchangeMutation;

  const handleExchange = () => {
    if (currentBook && selectedBook && user?._id) {
      mutate({
        requesterId: user._id,
        requestedBookId: currentBook._id,
        offeredBookId: selectedBook,
      });
    }
  };

  const openDialog = (book: Book) => {
    setCurrentBook(book);
    if (user?._id) {
      fetchUserBooks(user._id).then((books) => {
        setUserBooks(books);
        setIsDialogOpen(true);
      });
    }
  };

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<Book>();

    return [
      columnHelper.accessor("title", {
        cell: (info) => info.getValue(),
        header: () => "Title",
      }),
      columnHelper.accessor("author", {
        cell: (info) => info.getValue(),
        header: () => "Author",
      }),
      columnHelper.accessor("genre", {
        cell: (info) => info.getValue(),
        header: () => "Genre",
      }),
      columnHelper.accessor((row) => row.owner.username, {
        id: "ownerName",
        cell: (info) => info.getValue() || "Loading...",
        header: () => "Owner",
      }),
      columnHelper.accessor("_id", {
        id: "action",
        cell: (info) => {
          const book = info.row.original;
          const isRequested =
            exchangeMutation.isSuccess && currentBook?._id === book._id;
          return (
            <Button onClick={() => openDialog(book)} disabled={isRequested}>
              {isRequested ? "Requested" : "Interested"}
            </Button>
          );
        },
        header: () => "Action",
      }),
    ];
  }, [user?._id, exchangeMutation.isSuccess, currentBook]);

  const table = useReactTable({
    data: booksWithOwners,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: {
      fuzzy: fuzzyFilter,
    },
  });

  const uniqueGenres = useMemo(() => {
    const genres = new Set(booksWithOwners.map((book) => book.genre));
    return Array.from(genres);
  }, [booksWithOwners]);

  useEffect(() => {
    if (genreFilter === "all") {
      table.getColumn("genre")?.setFilterValue(undefined);
    } else {
      table.getColumn("genre")?.setFilterValue(genreFilter);
    }
  }, [genreFilter, table]);

  if (isBooksLoading) return <div>Loading...</div>;
  if (booksError)
    return <div>An error occurred: {(booksError as Error).message}</div>;

  return (
    <div className="w-full flex flex-col gap-6">
      <Toaster position="bottom-right" />
      <h1 className="font-bold text-3xl">Discover Books...</h1>
      <div className="flex flex-col w-full sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Input
            placeholder="Search books..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(String(e.target.value))}
            className="max-w-sm"
          />
          <Select onValueChange={(value) => setGenreFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select Genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {uniqueGenres.map((genre) => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="ghost"
          className="gap-1 border-2 p-2 sm:px-4 w-full sm:w-auto ml-auto"
          onClick={() => setIsAddBookSheetOpen(true)}
        >
          <BookDown className="h-4 w-4" />
          <span className="sm:inline">Add your books</span>
        </Button>
        <AddBookSheet
          isOpen={isAddBookSheetOpen}
          onOpenChange={setIsAddBookSheetOpen}
        />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Exchange Book</DialogTitle>
            <DialogDescription>
              {currentBook
                ? `Select one of your books to exchange for "${currentBook.title}" by ${currentBook.author}`
                : !currentBook
                ? "Add your book details..."
                : "Loading your books..."}
            </DialogDescription>
          </DialogHeader>
          {userBooks.length > 0 ? (
            <>
              <RadioGroup
                onValueChange={(value) => setSelectedBook(value)}
                className="gap-4"
              >
                {userBooks.map((userBook) => (
                  <div
                    key={userBook._id.toString()}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem
                      value={userBook._id.toString()}
                      id={userBook._id.toString()}
                    />
                    <Label htmlFor={userBook._id.toString()}>
                      {userBook.title} by {userBook.author}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExchange}
                  disabled={!selectedBook || exchangeMutation.isPending}
                >
                  {exchangeMutation.isPending ? "Exchanging..." : "Exchange"}
                </Button>
              </div>
            </>
          ) : (
            <p>
              You don't have any books to exchange. Please add some books first.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
