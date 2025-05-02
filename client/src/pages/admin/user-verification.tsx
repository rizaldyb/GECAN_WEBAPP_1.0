import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import UserProfileReviewModal from "@/components/user/user-profile-review-modal";
import { Search, Filter, Eye, Check, X, HelpCircle } from "lucide-react";

export default function UserVerification() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch pending verification users
  const { data: users, isLoading, isError } = useQuery<User[]>({
    queryKey: ["/api/users/pending"],
  });

  // Filter users based on search query and status filter
  const filteredUsers = React.useMemo(() => {
    if (!users) return [];
    
    return users.filter(user => {
      // Apply status filter
      if (statusFilter !== "all" && user.status.toLowerCase() !== statusFilter) {
        return false;
      }
      
      // Apply search filter (case-insensitive)
      const searchString = searchQuery.toLowerCase();
      return (
        user.firstName.toLowerCase().includes(searchString) ||
        user.lastName.toLowerCase().includes(searchString) ||
        user.email.toLowerCase().includes(searchString) ||
        user.companyName.toLowerCase().includes(searchString)
      );
    });
  }, [users, searchQuery, statusFilter]);

  // Get status filter counts
  const getStatusCounts = React.useMemo(() => {
    if (!users) return { all: 0, pending: 0, "info requested": 0, "under review": 0 };
    
    return {
      all: users.length,
      pending: users.filter(user => user.status.toLowerCase() === "pending").length,
      "info requested": users.filter(user => user.status.toLowerCase() === "info requested").length,
      "under review": users.filter(user => user.status.toLowerCase() === "under review").length
    };
  }, [users]);

  // Handle user action (view profile)
  const handleViewProfile = (userId: number) => {
    setSelectedUserId(userId);
    setModalOpen(true);
  };

  // Format date relative to current time
  const formatRelativeTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  // Get status badge styles
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === "pending") {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 flex items-center">
        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5"></span>
        Pending Verification
      </Badge>;
    }
    
    if (statusLower === "info requested") {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100 flex items-center">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
        Info Requested
      </Badge>;
    }
    
    if (statusLower === "under review") {
      return <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100 flex items-center">
        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
        Under Review
      </Badge>;
    }
    
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="animate-fadeIn">
      {/* Filters & Actions */}
      <div className="flex flex-wrap justify-between items-center mb-4">
        <div className="flex space-x-2 mb-2 sm:mb-0">
          <Button 
            variant={statusFilter === "all" ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All <span className="text-neutral-400 ml-1">({getStatusCounts.all})</span>
          </Button>
          <Button 
            variant={statusFilter === "pending" ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter("pending")}
          >
            New <span className="text-neutral-400 ml-1">({getStatusCounts.pending})</span>
          </Button>
          <Button 
            variant={statusFilter === "info requested" ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter("info requested")}
          >
            Info Requested <span className="text-neutral-400 ml-1">({getStatusCounts["info requested"]})</span>
          </Button>
          <Button 
            variant={statusFilter === "under review" ? "default" : "outline"} 
            size="sm"
            onClick={() => setStatusFilter("under review")}
          >
            Under Review <span className="text-neutral-400 ml-1">({getStatusCounts["under review"]})</span>
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Input 
              type="text" 
              placeholder="Search users..." 
              className="pl-9 pr-3 w-60"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4 text-neutral-400" />
          </Button>
        </div>
      </div>
      
      {/* Users Table */}
      <div className="bg-white shadow-sm rounded-lg border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="styled-table min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Company</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Member Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Submitted</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {isLoading ? (
                // Loading state with skeleton UI
                Array(3).fill(0).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="ml-3">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32 mt-1" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-6 w-32 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-red-500">
                    Error loading user data. Please try again later.
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-neutral-500">
                    No users found matching the current filters.
                  </td>
                </tr>
              ) : (
                // Actual user data
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-medium">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-neutral-800">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-neutral-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {user.companyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.memberType?.map((type, index) => (
                          <span key={index} className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
                            {type.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {formatRelativeTime(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleViewProfile(user.id)}
                          className="text-primary hover:text-primary/80 hover:bg-primary/10"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleViewProfile(user.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleViewProfile(user.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"
                          onClick={() => handleViewProfile(user.id)}
                        >
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-neutral-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-neutral-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredUsers.length}</span> of <span className="font-medium">{filteredUsers.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button variant="outline" size="sm" className="rounded-l-md">
                  <span className="sr-only">Previous</span>
                  <i className="ri-arrow-left-s-line"></i>
                </Button>
                <Button variant="outline" size="sm" className="bg-primary/5 text-primary border-primary/20">
                  1
                </Button>
                <Button variant="outline" size="sm" className="rounded-r-md">
                  <span className="sr-only">Next</span>
                  <i className="ri-arrow-right-s-line"></i>
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Review Modal */}
      {selectedUserId && (
        <UserProfileReviewModal 
          userId={selectedUserId}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedUserId(null);
          }}
        />
      )}
    </div>
  );
}
