import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useForm } from "react-hook-form";
import useUserStore from "@/hooks/useUserStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import NavBar from "../Navbar";
import { ScrollArea } from "@radix-ui/react-scroll-area";

interface ExchangeRequest {
  _id: string;
  requester: { _id: string } | string;
  requestedBook: {
    _id: string;
    title: string;
    author: string;
  };
  offeredBook: {
    _id: string;
    title: string;
    author: string;
  };
  status: "pending" | "accepted" | "rejected";
}

interface Book {
  _id: string;
  title: string;
  author: string;
  genre: string;
  isAvailable: boolean;
}

const fetchUserExchangeRequests = async (userId: string) => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/api/books/user-exchanges/${userId}`
  );
  return response.data;
};

const fetchOwnerName = async (userId: string) => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/api/user/auth/info/${userId}`
  );
  return response.data.name;
};

const updateExchangeRequest = async ({
  requestId,
  status,
}: {
  requestId: string;
  status: "accepted" | "rejected";
}) => {
  const response = await axios.put(
    `${import.meta.env.VITE_API_URL}/api/books/exchange/${requestId}`,
    { status }
  );
  return response.data;
};

const fetchUserBooks = async (userId: string) => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/api/books/user/${userId}`
  );
  return response.data;
};

const updateBook = async (bookId: string, bookData: Partial<Book>) => {
  const response = await axios.put(
    `${import.meta.env.VITE_API_URL}/api/books/${bookId}`,
    bookData
  );
  return response.data;
};

const deleteBook = async (bookId: string) => {
  const response = await axios.delete(
    `${import.meta.env.VITE_API_URL}/api/books/${bookId}`
  );
  return response.data;
};

export default function ExchangeRequestsPage() {
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<Book>();

  const {
    data: exchangeRequests,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["exchangeRequests", user?._id],
    queryFn: () => fetchUserExchangeRequests(user?._id || ""),
    enabled: !!user?._id,
  });

  const {
    data: userBooks,
    isLoading: userBooksLoading,
    error: userBooksError,
  } = useQuery({
    queryKey: ["userBooks", user?._id],
    queryFn: () => fetchUserBooks(user?._id || ""),
    enabled: !!user?._id,
  });

  const updateMutation = useMutation({
    mutationFn: updateExchangeRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["exchangeRequests", user?._id],
      });
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: ({
      bookId,
      bookData,
    }: {
      bookId: string;
      bookData: Partial<Book>;
    }) => updateBook(bookId, bookData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userBooks", user?._id] });
      setEditingBook(null);
      setIsEditDialogOpen(false);
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userBooks", user?._id] });
    },
  });

  const handleUpdateRequest = (
    requestId: string,
    status: "accepted" | "rejected"
  ) => {
    updateMutation.mutate({ requestId, status });
  };

  const onSubmit = (data: Book) => {
    if (editingBook) {
      updateBookMutation.mutate({ bookId: editingBook._id, bookData: data });
    }
  };

  const handleDeleteBook = (bookId: string) => {
    deleteBookMutation.mutate(bookId);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred: {(error as Error).message}</div>;

  const { sent = [], received = [] } = exchangeRequests || {};

  const RequestCard = ({
    request,
    showActions = false,
  }: {
    request: ExchangeRequest;
    showActions?: boolean;
  }) => {
    const requesterId =
      typeof request.requester === "string"
        ? request.requester
        : request.requester?._id;

    const { data: requesterName } = useQuery({
      queryKey: ["userName", requesterId],
      queryFn: () => fetchOwnerName(requesterId || ""),
      enabled: !!requesterId,
    });

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <span className="mb-2 sm:mb-0">
              {request.requestedBook?.title || "No title"}
            </span>
            <Badge
              variant={
                request.status === "pending"
                  ? "default"
                  : request.status === "accepted"
                  ? "secondary"
                  : "destructive"
              }
            >
              {request.status}
            </Badge>
          </CardTitle>
          <CardDescription>
            by {request.requestedBook?.author || "Unknown author"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Requester:</strong> {requesterName || "Loading..."}
          </p>
          <p>
            <strong>Offered Book:</strong>{" "}
            {request.offeredBook?.title || "No title"} by{" "}
            {request.offeredBook?.author || "Unknown author"}
          </p>
        </CardContent>
        {showActions && request.status === "pending" && (
          <CardFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              className="w-full sm:w-auto"
              onClick={() => handleUpdateRequest(request._id, "accepted")}
            >
              Accept
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant="outline"
              onClick={() => handleUpdateRequest(request._id, "rejected")}
            >
              Reject
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  };

  const RequestList = ({
    requests,
    showActions = false,
  }: {
    requests: ExchangeRequest[];
    showActions?: boolean;
  }) => (
    <div>
      {requests.length === 0 ? (
        <p>No requests at the moment.</p>
      ) : (
        requests.map((request) => (
          <RequestCard
            key={request._id}
            request={request}
            showActions={showActions}
          />
        ))
      )}
    </div>
  );

  const BookCard = ({ book }: { book: Book }) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{book.title}</CardTitle>
        <CardDescription>{book.author}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          <strong>Genre:</strong> {book.genre}
        </p>
        <p>
          <strong>Available:</strong> {book.isAvailable ? "Yes" : "No"}
        </p>
      </CardContent>
      <CardFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setEditingBook(book);
            reset(book);
            setIsEditDialogOpen(true);
          }}
        >
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full sm:w-auto" variant="destructive">
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                book.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeleteBook(book._id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-6 min-h-screen">
      <NavBar />
      <ScrollArea>
        <>
          <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Exchange Requests</h1>
            <Tabs defaultValue="received">
              <TabsList className="mb-4 flex flex-wrap">
                <TabsTrigger value="received" className="flex-grow">
                  Received Requests
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex-grow">
                  Sent Requests
                </TabsTrigger>
                <TabsTrigger value="your-books" className="flex-grow">
                  Your Books
                </TabsTrigger>
              </TabsList>
              <TabsContent value="received">
                <RequestList requests={received} showActions={true} />
              </TabsContent>
              <TabsContent value="sent">
                <RequestList requests={sent} />
              </TabsContent>
              <TabsContent value="your-books">
                {userBooksLoading ? (
                  <div>Loading your books...</div>
                ) : userBooksError ? (
                  <div>
                    Error loading your books:{" "}
                    {(userBooksError as Error).message}
                  </div>
                ) : (
                  <div>
                    {userBooks.map((book: Book) => (
                      <BookCard key={book._id} book={book} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Book</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input {...register("title")} id="title" />
                  </div>
                  <div>
                    <Label htmlFor="author">Author</Label>
                    <Input {...register("author")} id="author" />
                  </div>
                  <div>
                    <Label htmlFor="genre">Genre</Label>
                    <Input {...register("genre")} id="genre" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="isAvailable" {...register("isAvailable")} />
                    <Label htmlFor="isAvailable">Available</Label>
                  </div>
                  <Button type="submit" className="w-full">
                    Save Changes
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </>
      </ScrollArea>
    </div>
  );
}
