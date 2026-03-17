from app.models.user import User


def user_to_client_dict(user: User) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
        "name": user.name,
        "fatherName": user.father_name,
        "dob": user.dob,
        "cnic": user.cnic,
        "mobile": user.mobile,
        "photoUrl": user.photo_url,
        "company": user.company,
        "disabled": user.disabled,
        "companyName": user.company_name,
        "companyLogo": user.company_logo,
        "companyRegistrationNumber": user.company_registration_number,
    }
